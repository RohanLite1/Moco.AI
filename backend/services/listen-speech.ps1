Add-Type -AssemblyName System.Speech

try {
    $engine = New-Object System.Speech.Recognition.SpeechRecognitionEngine
    $engine.SetInputToDefaultAudioDevice()
    $grammar = New-Object System.Speech.Recognition.DictationGrammar
    $engine.LoadGrammar($grammar)

    # Listen with a 4 second initial silence timeout
    $result = $engine.Recognize([TimeSpan]::FromSeconds(4))
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
