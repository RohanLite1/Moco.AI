import http from 'http';
import url from 'url';
import { processVoiceCommand } from './services/voiceAgentService.js';
import { evaluateExpression, generateGraphData } from './services/mathService.js';
import { translateText } from './services/translatorService.js';
import { generateStreamingResponse, checkOllamaHealth } from './services/ollamaService.js';
import { ChessGame } from './services/gameEngines/chessEngine.js';
import { TetrisGame } from './services/gameEngines/tetrisEngine.js';
import { SnakeGame } from './services/gameEngines/snakeEngine.js';

const PORT = process.env.PORT || 3001;

let activeChess = new ChessGame();
let activeTetris = new TetrisGame();
let activeSnake = new SnakeGame();

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // --- API Endpoints ---
  if (pathname === '/api/health' && req.method === 'GET') {
    const health = await checkOllamaHealth();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ollama: health }));
    return;
  }

  if (pathname === '/api/voice' && req.method === 'POST') {
    const body = await parseBody(req);
    const start = Date.now();
    const result = await processVoiceCommand(body.command);
    const latency = Date.now() - start;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...result, latencyMs: latency }));
    return;
  }

  if (pathname === '/api/math/evaluate' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = evaluateExpression(body.expression || '');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/math/graph' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = generateGraphData(body.fn || 'x^2', body.xMin ?? -10, body.xMax ?? 10, body.sampleCount ?? 50);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/translate' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = await translateText(body.text || '', body.targetLanguage || 'Spanish');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/chat' && req.method === 'POST') {
    const body = await parseBody(req);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    try {
      await generateStreamingResponse(body.prompt || '', (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
    return;
  }

  // --- Serve Built-in Web Browser Testing Playground ---
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getTestingHtml());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function getTestingHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Moco.AI - Local Web Testing Playground</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #06b6d4;
      --primary-glow: rgba(6, 182, 212, 0.25);
      --accent: #8b5cf6;
      --success: #10b981;
      --warning: #f59e0b;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --radius: 16px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.12) 0px, transparent 50%),
        radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.05) 0px, transparent 50%);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      padding: 32px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .container {
      width: 100%;
      max-width: 1000px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #06b6d4, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      box-shadow: 0 0 20px var(--primary-glow);
    }

    .brand-title h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(90deg, #38bdf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-title p {
      font-size: 12px;
      color: var(--text-muted);
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 500;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    /* Voice Interaction Hero Card */
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .card-title {
      font-size: 17px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .voice-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px 0;
      gap: 20px;
    }

    .mic-button-wrapper {
      position: relative;
    }

    .mic-button {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      font-size: 38px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 35px var(--primary-glow);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      z-index: 2;
    }

    .mic-button:hover {
      transform: scale(1.08);
      box-shadow: 0 0 50px rgba(6, 182, 212, 0.5);
    }

    .mic-button.listening {
      background: linear-gradient(135deg, #ef4444, #f97316);
      box-shadow: 0 0 50px rgba(239, 68, 68, 0.6);
      animation: pulseMic 1.5s infinite;
    }

    @keyframes pulseMic {
      0% { transform: scale(1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.4); }
      50% { transform: scale(1.1); box-shadow: 0 0 60px rgba(239, 68, 68, 0.8); }
      100% { transform: scale(1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.4); }
    }

    .voice-status-text {
      font-size: 15px;
      color: var(--text-muted);
      min-height: 24px;
    }

    .voice-status-text.active {
      color: #38bdf8;
      font-weight: 500;
    }

    /* Waveform visualizer */
    .waveform-bar-container {
      display: flex;
      align-items: center;
      gap: 5px;
      height: 36px;
    }

    .bar {
      width: 4px;
      background: #38bdf8;
      border-radius: 2px;
      height: 6px;
      transition: height 0.1s ease;
    }

    .bar.animated {
      animation: soundWave 0.8s ease-in-out infinite alternate;
    }

    @keyframes soundWave {
      0% { height: 6px; }
      100% { height: 32px; }
    }

    /* Input & Preset Buttons */
    .input-row {
      display: flex;
      gap: 10px;
      width: 100%;
      margin-top: 10px;
    }

    input[type="text"] {
      flex: 1;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      color: var(--text);
      font-size: 15px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    input[type="text"]:focus {
      border-color: var(--primary);
    }

    .btn {
      padding: 14px 24px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .preset-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-top: 8px;
    }

    .chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: 9999px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .chip:hover {
      background: rgba(6, 182, 212, 0.15);
      color: #38bdf8;
      border-color: rgba(6, 182, 212, 0.3);
    }

    /* Response Result Card */
    .result-box {
      margin-top: 20px;
      padding: 20px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.06);
      display: none;
      flex-direction: column;
      gap: 12px;
      text-align: left;
    }

    .result-box.show {
      display: flex;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
    }

    .badge-navigate { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-calculate { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-translate { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-chat { background: rgba(139, 92, 246, 0.2); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.3); }

    .result-reply {
      font-size: 16px;
      line-height: 1.5;
      color: #f3f4f6;
    }

    .result-latency {
      font-size: 12px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Tool Tabs Grid */
    .grid-tabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .mini-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mini-card h3 {
      font-size: 15px;
      font-weight: 600;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mini-card p {
      font-size: 13px;
      color: var(--text-muted);
    }

    .mini-card button {
      margin-top: auto;
      padding: 10px;
      border-radius: 8px;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--card-border);
      color: var(--text);
      font-weight: 500;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mini-card button:hover {
      background: rgba(6, 182, 212, 0.2);
      border-color: var(--primary);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="avatar-icon">🐕</div>
        <div class="brand-title">
          <h1>Moco.AI Live Local Tester</h1>
          <p>Zero Build Wait • Instant Microphone & Local LLM Runner</p>
        </div>
      </div>
      <div class="status-badge" id="backendStatus">
        <span class="status-dot"></span>
        <span id="statusLabel">Local Backend Online</span>
      </div>
    </header>

    <!-- Main Voice Testing Card -->
    <div class="card">
      <div class="card-title">
        <span>🎙️ Live Autonomous Voice Command Tester</span>
        <span style="font-size: 12px; color: var(--text-muted);">Web Speech API + Ollama Local Agent</span>
      </div>

      <div class="voice-hero">
        <div class="mic-button-wrapper">
          <button id="micBtn" class="mic-button" title="Click to Speak">🎤</button>
        </div>

        <div class="waveform-bar-container" id="equalizer">
          ${Array.from({length: 16}).map((_, i) => `<div class="bar" style="animation-delay: ${i * 0.06}s"></div>`).join('')}
        </div>

        <div id="voiceStatus" class="voice-status-text">Click the microphone to speak, or type below</div>

        <!-- Presets for fast testing without speaking -->
        <div class="preset-chips">
          <button class="chip" onclick="testPreset('open pomodoro')">⏱️ Open Pomodoro</button>
          <button class="chip" onclick="testPreset('start pomodoro')">⏱️ Start Pomodoro</button>
          <button class="chip" onclick="testPreset('open my tasks')">📋 Open My Tasks</button>
          <button class="chip" onclick="testPreset('play some music')">🎵 Play Some Music</button>
          <button class="chip" onclick="testPreset('play chess')">♟️ Play Chess</button>
          <button class="chip" onclick="testPreset('what is 45 plus 55')">🧮 45 plus 55</button>
          <button class="chip" onclick="testPreset('calculate sin(pi / 2) + 2^3')">📐 sin(pi/2) + 2^3</button>
          <button class="chip" onclick="testPreset('translate hello to Spanish')">🌐 Hello to Spanish</button>
          <button class="chip" onclick="testPreset('tell me a funny joke')">💬 Tell me a joke</button>
          <button class="chip" onclick="testPreset('who are you')">🤖 Who are you?</button>
        </div>

        <!-- Input row -->
        <div class="input-row">
          <input type="text" id="commandInput" placeholder="Or type a voice command and press Enter..." />
          <button class="btn" id="sendBtn">Send Command</button>
        </div>
      </div>

      <!-- Result Display -->
      <div class="result-box" id="resultBox">
        <div class="result-header">
          <span class="badge" id="actionBadge">ACTION</span>
          <span class="badge" id="targetBadge" style="display:none;">TARGET</span>
          <span class="result-latency" id="latencyLabel">⚡ 0 ms</span>
        </div>
        <div class="result-reply" id="replyText"></div>
      </div>
    </div>

    <!-- Other Backend Feature Modules -->
    <div class="grid-tabs">
      <div class="mini-card">
        <h3>📐 Math & Desmos Plotter</h3>
        <p>Safely parses complex expressions, trigonometry, roots, and sample points.</p>
        <button onclick="testPreset('calculate sqrt(144) + 5^3')">Test Math (sqrt(144) + 5^3)</button>
      </div>

      <div class="mini-card">
        <h3>♟️ Minimax Chess Engine</h3>
        <p>Full 8x8 move validation, turn switching, and depth-1 AI bot opponent.</p>
        <button onclick="testPreset('play chess')">Trigger Games Arcade</button>
      </div>

      <div class="mini-card">
        <h3>🌍 Ollama Translation</h3>
        <p>Fast offline translation powered by local Gemma 3.</p>
        <button onclick="testPreset('translate Good luck with the hackathon into French')">Test French Translation</button>
      </div>
    </div>
  </div>

  <script>
    const micBtn = document.getElementById('micBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    const commandInput = document.getElementById('commandInput');
    const sendBtn = document.getElementById('sendBtn');
    const resultBox = document.getElementById('resultBox');
    const actionBadge = document.getElementById('actionBadge');
    const targetBadge = document.getElementById('targetBadge');
    const replyText = document.getElementById('replyText');
    const latencyLabel = document.getElementById('latencyLabel');
    const bars = document.querySelectorAll('.bar');

    let recognition = null;
    let isListening = false;

    // Initialize Web Speech API for Chrome / Edge
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        voiceStatus.textContent = 'Listening to your microphone... Speak now!';
        voiceStatus.classList.add('active');
        bars.forEach(b => b.classList.add('animated'));
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        commandInput.value = transcript;
        voiceStatus.textContent = 'Hearing: "' + transcript + '"';
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        voiceStatus.textContent = 'Speech note: ' + event.error + ' (You can also type above)';
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
        if (commandInput.value.trim()) {
          executeCommand(commandInput.value.trim());
        }
      };
    } else {
      voiceStatus.textContent = 'Web Speech not supported in this browser. You can type commands above!';
    }

    function toggleListening() {
      if (!recognition) {
        alert('Web Speech API is not available in this browser. Please use Chrome or Edge, or type in the input box.');
        return;
      }
      if (isListening) {
        recognition.stop();
      } else {
        commandInput.value = '';
        recognition.start();
      }
    }

    function stopListening() {
      isListening = false;
      micBtn.classList.remove('listening');
      bars.forEach(b => b.classList.remove('animated'));
      voiceStatus.classList.remove('active');
    }

    micBtn.addEventListener('click', toggleListening);

    async function executeCommand(cmd) {
      if (!cmd) return;
      voiceStatus.textContent = 'Processing command: "' + cmd + '"...';
      voiceStatus.classList.add('active');

      try {
        const res = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        renderResult(data);
        voiceStatus.textContent = 'Done! Action: ' + data.action + (data.target ? ' -> ' + data.target : '');
      } catch (err) {
        alert('Error communicating with local backend: ' + err.message);
        voiceStatus.textContent = 'Error: ' + err.message;
      }
    }

    function renderResult(data) {
      resultBox.classList.add('show');
      actionBadge.textContent = data.action || 'RESPONSE';
      actionBadge.className = 'badge badge-' + (data.action || 'chat').toLowerCase();

      if (data.target) {
        targetBadge.style.display = 'inline-block';
        targetBadge.textContent = 'TARGET: ' + data.target.toUpperCase();
        targetBadge.className = 'badge badge-navigate';
      } else {
        targetBadge.style.display = 'none';
      }

      latencyLabel.textContent = '⚡ ' + (data.latencyMs ?? 0) + ' ms';
      replyText.textContent = data.reply || '(No reply text)';
    }

    function testPreset(cmd) {
      commandInput.value = cmd;
      executeCommand(cmd);
    }

    sendBtn.addEventListener('click', () => {
      executeCommand(commandInput.value.trim());
    });

    commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeCommand(commandInput.value.trim());
      }
    });

    // Initial check of backend health
    fetch('/api/health')
      .then(r => r.json())
      .then(d => {
        if (d.ollama && d.ollama.online) {
          document.getElementById('statusLabel').textContent = 'Ollama & Backend Ready (' + d.ollama.models.length + ' models)';
        }
      })
      .catch(() => {});
  </script>
</body>
</html>`;
}

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Moco.AI Local Web Testing Server running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`======================================================\n`);
  console.log(`Open http://localhost:${PORT} in your web browser (Chrome/Edge) to test voice input!`);
});
