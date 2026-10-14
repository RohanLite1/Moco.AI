import { spawn } from 'child_process';

let activeSpeechProcess = null;

/**
 * Listens to speech natively using Windows System.Speech.Recognition.
 * Uses -EncodedCommand so it runs 100% offline inside packaged Electron (.exe / app.asar)
 * without requiring external .ps1 files on disk or cloud Google Speech API keys.
 */
export function listenToSpeechNative(timeoutSeconds = 5) {
  return new Promise((resolve) => {
    // If a process is already running, clean it up
    if (activeSpeechProcess) {
      try {
        activeSpeechProcess.kill();
      } catch (_) {}
      activeSpeechProcess = null;
    }

    const psScript = `
Add-Type -AssemblyName System.Speech
try {
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $engine.SetInputToDefaultAudioDevice()
    $grammar = New-Object System.Speech.Recognition.DictationGrammar
    $engine.LoadGrammar($grammar)

    $result = $engine.Recognize([TimeSpan]::FromSeconds(${timeoutSeconds}))
    if ($result -ne $null -and $result.Text) {
        Write-Output "SPEECH_RESULT:$($result.Text)"
    } else {
        Write-Output "SPEECH_RESULT:NONE"
    }
} catch {
    Write-Output "SPEECH_ERROR:$($_.Exception.Message)"
} finally {
    if ($engine -ne $null) {
        $engine.Dispose()
    }
}
`;

    const b64 = Buffer.from(psScript, 'utf16le').toString('base64');
    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-EncodedCommand', b64
    ]);

    activeSpeechProcess = ps;
    let stdoutBuffer = '';

    ps.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
    });

    ps.stderr.on('data', () => {
      // ignore powershell CLIXML or progress records
    });

    ps.on('close', () => {
      activeSpeechProcess = null;
      const match = stdoutBuffer.match(/SPEECH_RESULT:(.*)/);
      if (match && match[1]) {
        const text = match[1].trim();
        if (text && text !== 'NONE') {
          return resolve({ success: true, text });
        }
      }
      resolve({ success: false, text: '' });
    });

    ps.on('error', (err) => {
      activeSpeechProcess = null;
      resolve({ success: false, text: '', error: err.message });
    });
  });
}

export function stopSpeechNative() {
  if (activeSpeechProcess) {
    try {
      activeSpeechProcess.kill();
    } catch (_) {}
    activeSpeechProcess = null;
  }
}
