import http from 'http';
import url from 'url';
import { processVoiceCommand } from './services/voiceAgentService.js';
import { evaluateExpression, generateGraphData } from './services/mathService.js';
import { translateText } from './services/translatorService.js';
import { generateStreamingResponse, checkOllamaHealth } from './services/ollamaService.js';
import { ChessGame } from './services/gameEngines/chessEngine.js';
import { TetrisGame } from './services/gameEngines/tetrisEngine.js';
import { SnakeGame } from './services/gameEngines/snakeEngine.js';
import { askLiveSearchAI, getLiveWeather } from './services/searchService.js';
import { getDeviceBattery } from './services/systemService.js';
import { listenToSpeechNative, stopSpeechNative } from './services/speechService.js';

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

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
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

  if (pathname === '/api/speech/listen' && req.method === 'POST') {
    const result = await listenToSpeechNative();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/speech/stop' && req.method === 'POST') {
    stopSpeechNative();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
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

  if (pathname === '/api/search' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = await askLiveSearchAI(body.query || '');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/weather' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = await getLiveWeather(body.location || '');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (pathname === '/api/system/battery' && req.method === 'GET') {
    const result = await getDeviceBattery();
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

  // --- Serve Full Moco.AI HUD with Voice Audio Integration ---
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHudHtml());
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

function getHudHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Moco.AI • Desktop HUD Assistant</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --island-bg: rgba(9, 14, 28, 0.88);
      --island-border: rgba(6, 182, 212, 0.32);
      --island-border-hover: rgba(6, 182, 212, 0.65);
      --island-glow: 0 16px 42px rgba(0, 0, 0, 0.75), 0 0 32px rgba(6, 182, 212, 0.22);
      --island-glow-active: 0 24px 60px rgba(0, 0, 0, 0.9), 0 0 45px rgba(6, 182, 212, 0.4);
      --island-text: #f8fafc;
      --island-text-muted: #94a3b8;
      --island-card-bg: rgba(255, 255, 255, 0.04);
      --island-card-border: rgba(255, 255, 255, 0.08);
      --island-waveform: #38bdf8;
      --island-accent: #06b6d4;
      --island-accent-purple: #a855f7;
      --island-accent-emerald: #10b981;
    }

    .theme-light {
      --island-bg: rgba(248, 250, 252, 0.92);
      --island-border: rgba(14, 165, 233, 0.35);
      --island-border-hover: rgba(14, 165, 233, 0.7);
      --island-glow: 0 16px 42px rgba(15, 23, 42, 0.16), 0 0 28px rgba(14, 165, 233, 0.2);
      --island-glow-active: 0 22px 55px rgba(15, 23, 42, 0.24), 0 0 40px rgba(14, 165, 233, 0.3);
      --island-text: #0f172a;
      --island-text-muted: #475569;
      --island-card-bg: rgba(15, 23, 42, 0.04);
      --island-card-border: rgba(15, 23, 42, 0.08);
      --island-waveform: #0284c7;
      --island-accent: #0284c7;
      --island-accent-purple: #9333ea;
      --island-accent-emerald: #059669;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: #030712;
      background-image: 
        radial-gradient(at 0% 0%, rgba(6, 182, 212, 0.15) 0px, transparent 55%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 55%),
        radial-gradient(at 50% 50%, rgba(16, 185, 129, 0.06) 0px, transparent 60%);
      color: var(--island-text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: background-color 0.3s;
    }

    /* Screen Viewport */
    .dynamic-island-viewport {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 18px;
      padding-bottom: 30px;
    }

    /* Core Dynamic Island Shell */
    .dynamic-island-shell {
      position: relative;
      background: var(--island-bg);
      backdrop-filter: blur(34px);
      -webkit-backdrop-filter: blur(34px);
      border: 1px solid var(--island-border);
      box-shadow: var(--island-glow);
      transition: all 0.44s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      user-select: none;
      color: var(--island-text);
    }

    /* --- 1. COMPACT PILL MODE --- */
    .dynamic-island-shell.pill {
      width: 620px;
      max-width: 94vw;
      height: 60px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 14px 6px 8px;
      cursor: pointer;
    }

    .dynamic-island-shell.pill:hover {
      border-color: var(--island-border-hover);
      box-shadow: var(--island-glow-active);
      transform: translateY(2px) scale(1.012);
    }

    .pill-left {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 100%;
    }

    .pill-robot-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--island-card-bg);
      border: 1px solid var(--island-border);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 14px rgba(6, 182, 212, 0.3);
      position: relative;
    }

    .pill-meta {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .pill-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.2px;
      color: var(--island-text);
    }

    .pill-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
    }

    .pill-status-dot.listening {
      background: #ef4444;
      box-shadow: 0 0 12px #ef4444;
      animation: pulseDot 1s infinite;
    }

    .pill-status-dot.thinking {
      background: #a855f7;
      box-shadow: 0 0 12px #a855f7;
      animation: pulseDot 1.2s infinite;
    }

    .pill-status-dot.speaking {
      background: #10b981;
      box-shadow: 0 0 12px #10b981;
    }

    @keyframes pulseDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.6; }
    }

    .pill-subtitle {
      font-size: 11px;
      color: var(--island-text-muted);
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }

    /* Pill Center Waveform Equalizer */
    .pill-center {
      display: flex;
      align-items: center;
      gap: 3.5px;
      padding: 0 10px;
    }

    .soundwave-bar {
      width: 3.5px;
      background: var(--island-waveform);
      border-radius: 9999px;
      height: 6px;
      transition: height 0.15s ease;
      box-shadow: 0 0 6px rgba(56, 189, 248, 0.4);
    }

    .soundwave-bar.active {
      animation: waveAnim 0.7s ease-in-out infinite alternate;
    }

    @keyframes waveAnim {
      0% { height: 6px; }
      100% { height: 26px; }
    }

    /* Pill Right Controls */
    .pill-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pill-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 4px 8px;
      border-radius: 9999px;
      background: var(--island-card-bg);
      border: 1px solid var(--island-card-border);
      font-size: 11px;
      font-weight: 600;
      color: var(--island-text-muted);
    }

    .pill-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--island-card-border);
      background: var(--island-card-bg);
      color: var(--island-text);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pill-btn:hover {
      background: rgba(6, 182, 212, 0.2);
      border-color: var(--island-accent);
      transform: scale(1.08);
    }

    .pill-btn.mic-active {
      background: rgba(239, 68, 68, 0.25);
      border-color: #ef4444;
      color: #ef4444;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.5);
      animation: pulseMic 1.4s infinite;
    }

    @keyframes pulseMic {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.12); }
    }

    /* --- 2. EXPANDED HUD WINDOW --- */
    .dynamic-island-shell.expanded {
      width: 960px;
      max-width: 94vw;
      height: 640px;
      border-radius: 28px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--island-glow-active);
    }

    .island-header {
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      border-bottom: 1px solid var(--island-card-border);
      background: rgba(0, 0, 0, 0.15);
    }

    .island-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 16px;
      letter-spacing: -0.3px;
    }

    .island-status-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      background: var(--island-card-bg);
      border: 1px solid var(--island-card-border);
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--island-accent);
    }

    /* Tabs */
    .island-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(0, 0, 0, 0.25);
      padding: 4px;
      border-radius: 14px;
      border: 1px solid var(--island-card-border);
    }

    .island-tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 10px;
      border: none;
      background: transparent;
      color: var(--island-text-muted);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .island-tab-btn:hover {
      color: var(--island-text);
      background: rgba(255, 255, 255, 0.05);
    }

    .island-tab-btn.active {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(139, 92, 246, 0.25));
      border: 1px solid rgba(6, 182, 212, 0.4);
      color: #38bdf8;
      box-shadow: 0 0 12px rgba(6, 182, 212, 0.2);
    }

    .island-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .island-control-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid var(--island-card-border);
      background: var(--island-card-bg);
      color: var(--island-text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .island-control-btn:hover {
      color: var(--island-text);
      border-color: var(--island-accent);
    }

    .island-control-btn.close:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #ef4444;
    }

    /* Island Main Deck */
    .island-main {
      flex: 1;
      display: grid;
      grid-template-columns: 290px 1fr;
      overflow: hidden;
    }

    /* Left: 3D Robot Deck */
    .island-robot-deck {
      border-right: 1px solid var(--island-card-border);
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 14px;
      background: rgba(0, 0, 0, 0.12);
    }

    .island-robot-stage {
      flex: 1;
      border-radius: 18px;
      background: radial-gradient(circle at center, rgba(6, 182, 212, 0.08) 0%, rgba(0,0,0,0.4) 80%);
      border: 1px solid var(--island-card-border);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
    }

    #robotCanvas {
      width: 250px;
      height: 250px;
    }

    .robot-overlay-badge {
      position: absolute;
      bottom: 12px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 11px;
      font-weight: 600;
      color: #38bdf8;
      backdrop-filter: blur(8px);
    }

    /* Expressions */
    .island-expression-bar {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .expression-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      color: var(--island-text-muted);
    }

    .expression-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
    }

    .expression-btn {
      padding: 6px 2px;
      border-radius: 8px;
      border: 1px solid var(--island-card-border);
      background: var(--island-card-bg);
      color: var(--island-text-muted);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      transition: all 0.2s;
    }

    .expression-btn:hover {
      color: var(--island-text);
      border-color: var(--island-accent);
    }

    .expression-btn.active {
      background: rgba(6, 182, 212, 0.2);
      border-color: var(--island-accent);
      color: #38bdf8;
    }

    /* Right: Active Widget Body */
    .island-widget-body {
      padding: 18px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* HUD Widgets Common */
    .widget-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .widget-title {
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--island-text);
    }

    .widget-badge {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--island-accent);
      background: rgba(6, 182, 212, 0.12);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(6, 182, 212, 0.25);
    }

    /* Chat Widget */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-right: 6px;
      min-height: 400px;
      max-height: 460px;
    }

    .message {
      padding: 12px 16px;
      border-radius: 16px;
      max-width: 82%;
      font-size: 14px;
      line-height: 1.5;
    }

    .message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant {
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--island-card-border);
      color: var(--island-text);
      border-bottom-left-radius: 4px;
    }

    .chat-input-row {
      display: flex;
      gap: 8px;
      background: rgba(0, 0, 0, 0.35);
      padding: 6px 8px 6px 14px;
      border-radius: 14px;
      border: 1px solid var(--island-card-border);
    }

    .chat-input-row input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--island-text);
      font-size: 14px;
      font-family: inherit;
      outline: none;
    }

    .chat-send-btn {
      padding: 8px 16px;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Pomodoro Widget */
    .pomodoro-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }

    .pomo-time-display {
      font-size: 72px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: -2px;
      color: #38bdf8;
      text-shadow: 0 0 30px rgba(56, 189, 248, 0.4);
    }

    .pomo-modes {
      display: flex;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px;
      border-radius: 12px;
      border: 1px solid var(--island-card-border);
    }

    .pomo-mode-btn {
      padding: 6px 16px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--island-text-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .pomo-mode-btn.active {
      background: var(--island-accent);
      color: #030712;
      box-shadow: 0 0 14px rgba(6, 182, 212, 0.4);
    }

    .pomo-controls {
      display: flex;
      gap: 12px;
    }

    .pomo-action-btn {
      padding: 12px 28px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: white;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pomo-action-btn.reset {
      background: rgba(255, 255, 255, 0.08);
      color: var(--island-text);
      border: 1px solid var(--island-card-border);
    }

    /* Todo Widget */
    .todo-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 440px;
    }

    .todo-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--island-card-bg);
      border: 1px solid var(--island-card-border);
      transition: all 0.2s;
    }

    .todo-item.completed {
      opacity: 0.5;
      text-decoration: line-through;
    }

    .todo-left {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .todo-checkbox {
      width: 18px;
      height: 18px;
      border-radius: 6px;
      border: 2px solid var(--island-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .todo-item.completed .todo-checkbox {
      background: var(--island-accent);
    }

    /* Music Widget */
    .music-player-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
    }

    .music-disc {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, #0284c7 0%, #090e1c 70%);
      border: 3px solid rgba(56, 189, 248, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.3);
    }

    .music-disc.playing {
      animation: spin 6s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Games Widget */
    .games-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      height: 100%;
    }

    .game-card {
      border-radius: 16px;
      border: 1px solid var(--island-card-border);
      background: var(--island-card-bg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
    }

    .game-icon {
      font-size: 38px;
    }

    /* Floating Voice Toast Notification */
    .voice-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(9, 14, 28, 0.94);
      border: 1px solid var(--island-accent);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(6, 182, 212, 0.4);
      padding: 12px 24px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      gap: 12px;
      backdrop-filter: blur(20px);
      z-index: 99999;
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }

    .voice-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .voice-toast-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(6, 182, 212, 0.2);
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
    }

    .voice-toast-text {
      font-size: 13px;
      font-weight: 500;
      color: var(--island-text);
    }
  </style>
</head>
<body class="theme-dark">
  <div class="dynamic-island-viewport">
    
    <!-- Dynamic Island Shell -->
    <div id="dynamicIsland" class="dynamic-island-shell pill">
      
      <!-- ================= 1. COLLAPSED PILL VIEW ================= -->
      <div id="pillView" style="display: flex; width: 100%; align-items: center; justify-content: space-between;">
        
        <!-- Left: RoboDog Face Canvas & Status -->
        <div class="pill-left">
          <div class="pill-robot-avatar">
            <canvas id="pillCanvas" width="46" height="46"></canvas>
          </div>
          <div class="pill-meta">
            <div class="pill-title">
              <span id="pillDot" class="pill-status-dot"></span>
              <span>Moco Robodog</span>
            </div>
            <div id="pillSubtitle" class="pill-subtitle">AIBO_UNIT_01 • Click to expand</div>
          </div>
        </div>

        <!-- Middle: Equalizer Waveform -->
        <div class="pill-center" title="Audio Waveform Equalizer">
          ${Array.from({length: 12}).map((_, i) => `<div class="soundwave-bar" id="wave${i}"></div>`).join('')}
        </div>

        <!-- Right: Telemetry & Controls -->
        <div class="pill-actions">
          <div class="pill-badge" id="batteryBadge" title="Battery">
            <span style="color: #38bdf8;">⚡</span>
            <span id="batteryPercentText">--%</span>
          </div>

          <button id="themeToggleBtn" class="pill-btn" title="Toggle Dark/Light Theme">
            🌓
          </button>

          <!-- Voice Mic Toggle Button -->
          <button id="pillMicBtn" class="pill-btn" title="Voice Command Mic">
            🎙️
          </button>

          <button id="pillExpandBtn" class="pill-btn" title="Expand HUD">
            ⌄
          </button>
        </div>
      </div>

      <!-- ================= 2. EXPANDED HUD VIEW ================= -->
      <div id="expandedView" style="display: none; width: 100%; height: 100%; flex-direction: column;">
        
        <!-- Top HUD Header -->
        <header class="island-header">
          <div class="island-brand">
            <span style="color: #06b6d4;">✨</span>
            <span>Moco.AI</span>
            <div class="island-status-pill">
              <span id="headerDot" class="pill-status-dot"></span>
              <span id="headerStatusText">IDLE</span>
            </div>
          </div>

          <!-- Navigation Tabs -->
          <nav class="island-tabs">
            <button class="island-tab-btn active" data-tab="chat">💬 AI Assistant</button>
            <button class="island-tab-btn" data-tab="pomodoro">⏱️ Pomodoro</button>
            <button class="island-tab-btn" data-tab="todo">📋 Tasks</button>
            <button class="island-tab-btn" data-tab="music">🎵 Music</button>
            <button class="island-tab-btn" data-tab="games">🎮 Games</button>
            <button class="island-tab-btn" data-tab="calc">🧮 Calculator</button>
          </nav>

          <!-- Action Controls -->
          <div class="island-controls">
            <button id="headerMicBtn" class="island-control-btn" title="Voice Command Mic">
              🎙️
            </button>
            <button id="headerThemeBtn" class="island-control-btn" title="Theme Toggle">
              🌓
            </button>
            <button id="minimizeBtn" class="island-control-btn" title="Collapse to Pill">
              ─
            </button>
          </div>
        </header>

        <!-- Main Body -->
        <div class="island-main">
          
          <!-- Left: 3D Hologram Stage & Expressions -->
          <aside class="island-robot-deck">
            <div class="island-robot-stage" id="robotStage" title="Click Moco to interact!">
              <canvas id="robotCanvas" width="250" height="250"></canvas>
              <div class="robot-overlay-badge" id="robotExpressionLabel">ROBO_DOG • IDLE</div>
            </div>

            <div class="island-expression-bar">
              <div class="expression-title">Command Expressions</div>
              <div class="expression-grid">
                <button class="expression-btn active" onclick="setAiStatus('idle')">📻 Idle</button>
                <button class="expression-btn" onclick="startVoiceRecognition()">🎙️ Listen</button>
                <button class="expression-btn" onclick="setAiStatus('thinking')">🧠 Think</button>
                <button class="expression-btn" onclick="setAiStatus('speaking')">🔊 Speak</button>
                <button class="expression-btn" onclick="setAiStatus('happy')">🐾 Happy</button>
              </div>
            </div>
          </aside>

          <!-- Right: Widget Body -->
          <main class="island-widget-body">
            
            <!-- Tab 1: AI Assistant Chat -->
            <div id="widget-chat" class="widget-container">
              <div class="widget-header">
                <div class="widget-title">🤖 Local Gemma Assistant</div>
                <div class="widget-badge">100% Offline AI</div>
              </div>

              <div class="chat-messages" id="chatFeed">
                <div class="message assistant">
                  Hello! I'm Moco, your desktop AI HUD companion. I listen to voice commands like <b>"Open pomodoro"</b>, <b>"Open tasks"</b>, <b>"Play chess"</b>, or <b>"What is 45 plus 55"</b>. Click the microphone or speak anytime!
                </div>
              </div>

              <form class="chat-input-row" id="chatForm">
                <input type="text" id="chatInput" placeholder="Ask Moco or speak a voice command..." />
                <button type="submit" class="chat-send-btn">Send</button>
              </form>
            </div>

            <!-- Tab 2: Pomodoro Focus -->
            <div id="widget-pomodoro" class="widget-container" style="display: none;">
              <div class="widget-header">
                <div class="widget-title">⏱️ Pomodoro Focus Timer</div>
                <div class="widget-badge" id="pomoSessionCount">Session #1</div>
              </div>

              <div class="pomodoro-card">
                <div class="pomo-modes">
                  <button class="pomo-mode-btn active" onclick="setPomoMode('work')">Focus (25m)</button>
                  <button class="pomo-mode-btn" onclick="setPomoMode('break')">Short Break (5m)</button>
                </div>

                <div class="pomo-time-display" id="pomoTime">25:00</div>

                <div class="pomo-controls">
                  <button class="pomo-action-btn" id="pomoToggleBtn" onclick="togglePomodoro()">Start Focus</button>
                  <button class="pomo-action-btn reset" onclick="resetPomodoro()">Reset</button>
                </div>
              </div>
            </div>

            <!-- Tab 3: Tasks / Todo Queue -->
            <div id="widget-todo" class="widget-container" style="display: none;">
              <div class="widget-header">
                <div class="widget-title">📋 Task Queue</div>
                <div class="widget-badge" id="todoCounter">1/3 Completed</div>
              </div>

              <div class="todo-list" id="todoList">
                <!-- Rendered dynamically -->
              </div>

              <form class="chat-input-row" id="todoForm">
                <input type="text" id="todoInput" placeholder="Add a new task to queue..." />
                <button type="submit" class="chat-send-btn">+ Add Task</button>
              </form>
            </div>

            <!-- Tab 4: Ambient Waves Music -->
            <div id="widget-music" class="widget-container" style="display: none;">
              <div class="widget-header">
                <div class="widget-title">🎵 Ambient Waves Player</div>
                <div class="widget-badge">Lo-Fi Cyberpunk</div>
              </div>

              <div class="music-player-box">
                <div class="music-disc" id="musicDisc">
                  <span style="font-size: 40px;">🎧</span>
                </div>

                <div style="text-align: center;">
                  <div style="font-weight: 700; font-size: 16px;">Midnight Coding Session</div>
                  <div style="font-size: 12px; color: var(--island-text-muted);">Moco Ambient Cyber Soundscapes</div>
                </div>

                <div style="display: flex; gap: 10px;">
                  <button class="pomo-action-btn" id="musicPlayBtn" onclick="toggleMusic()">▶ Play Audio</button>
                </div>
              </div>
            </div>

            <!-- Tab 5: Arcade Games -->
            <div id="widget-games" class="widget-container" style="display: none;">
              <div class="widget-header">
                <div class="widget-title">🎮 Arcade Mini Games</div>
                <div class="widget-badge">Local Engines</div>
              </div>

              <div class="games-grid">
                <div class="game-card">
                  <div class="game-icon">♟️</div>
                  <div style="font-weight: 700;">Minimax Chess</div>
                  <div style="font-size: 12px; color: var(--island-text-muted);">8x8 move validation vs AI bot</div>
                  <button class="pomo-action-btn reset" onclick="testVoiceCommand('play chess')">Launch Chess</button>
                </div>

                <div class="game-card">
                  <div class="game-icon">🐍</div>
                  <div style="font-weight: 700;">Retro Snake</div>
                  <div style="font-size: 12px; color: var(--island-text-muted);">Classic grid snake game loop</div>
                  <button class="pomo-action-btn reset" onclick="alert('Snake engine active!')">Launch Snake</button>
                </div>
              </div>
            </div>

            <!-- Tab 6: Scientific Calculator & Grapher -->
            <div id="widget-calc" class="widget-container" style="display: none;">
              <div class="widget-header">
                <div class="widget-title">🧮 Math & Desmos Plotter</div>
                <div class="widget-badge">Math Evaluator</div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 12px;">
                <form class="chat-input-row" id="calcForm">
                  <input type="text" id="calcInput" value="sin(x) * 3" placeholder="Enter equation e.g. x^2 - 4 or sin(x)" />
                  <button type="submit" class="chat-send-btn">Plot f(x)</button>
                </form>

                <canvas id="graphCanvas" width="600" height="260" style="background: rgba(0,0,0,0.4); border-radius: 12px; border: 1px solid var(--island-card-border);"></canvas>
                <div id="calcResult" style="font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #38bdf8;">Roots f(x)=0: Detected</div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  </div>

  <!-- Voice Toast Notification -->
  <div id="voiceToast" class="voice-toast">
    <span class="voice-toast-badge" id="toastBadge">ACTION</span>
    <span class="voice-toast-text" id="toastText">Voice command processed</span>
  </div>

  <script>
    // --- State Variables ---
    let isExpanded = false;
    let aiStatus = 'idle'; // 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy'
    let activeTab = 'chat';
    let isDark = true;
    let recognition = null;
    let isListening = false;

    // --- DOM Elements ---
    const island = document.getElementById('dynamicIsland');
    const pillView = document.getElementById('pillView');
    const expandedView = document.getElementById('expandedView');
    const pillSubtitle = document.getElementById('pillSubtitle');
    const pillDot = document.getElementById('pillDot');
    const headerDot = document.getElementById('headerDot');
    const headerStatusText = document.getElementById('headerStatusText');
    const pillMicBtn = document.getElementById('pillMicBtn');
    const headerMicBtn = document.getElementById('headerMicBtn');
    const voiceToast = document.getElementById('voiceToast');
    const toastBadge = document.getElementById('toastBadge');
    const toastText = document.getElementById('toastText');
    const chatFeed = document.getElementById('chatFeed');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');

    // --- Expand / Collapse Handlers ---
    island.addEventListener('click', (e) => {
      if (!isExpanded && !e.target.closest('button')) {
        expandHud();
      }
    });

    document.getElementById('pillExpandBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      expandHud();
    });

    document.getElementById('minimizeBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      collapseHud();
    });

    function expandHud() {
      isExpanded = true;
      island.classList.remove('pill');
      island.classList.add('expanded');
      pillView.style.display = 'none';
      expandedView.style.display = 'flex';
      drawRobotFace('robotCanvas', aiStatus);
    }

    function collapseHud() {
      isExpanded = false;
      island.classList.remove('expanded');
      island.classList.add('pill');
      expandedView.style.display = 'none';
      pillView.style.display = 'flex';
      drawRobotFace('pillCanvas', aiStatus);
    }

    // --- Tab Switching ---
    document.querySelectorAll('.island-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    function switchTab(tabId) {
      activeTab = tabId;
      document.querySelectorAll('.island-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tabId);
      });
      document.querySelectorAll('.widget-container').forEach(w => {
        w.style.display = 'none';
      });
      const targetWidget = document.getElementById('widget-' + tabId);
      if (targetWidget) targetWidget.style.display = 'flex';

      if (tabId === 'calc') {
        plotGraph('sin(x) * 3');
      }
    }

    // --- Theme Toggle ---
    function toggleTheme() {
      isDark = !isDark;
      document.body.className = isDark ? 'theme-dark' : 'theme-light';
    }
    document.getElementById('themeToggleBtn').addEventListener('click', (e) => { e.stopPropagation(); toggleTheme(); });
    document.getElementById('headerThemeBtn').addEventListener('click', toggleTheme);

    // --- 3D Procedural RoboDog OLED Avatar Face ---
    function drawRobotFace(canvasId, status) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Dark background visor
      ctx.fillStyle = '#050b14';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Glowing outer rim
      ctx.strokeStyle = status === 'listening' ? '#ef4444' : status === 'thinking' ? '#a855f7' : status === 'speaking' ? '#10b981' : '#06b6d4';
      ctx.lineWidth = w > 100 ? 4 : 2;
      ctx.stroke();

      // Eye Colors based on status
      let coreColor = '#e0f2fe';
      let midColor = '#38bdf8';
      let outerColor = '#0284c7';

      if (status === 'thinking') {
        coreColor = '#f3e8ff'; midColor = '#c084fc'; outerColor = '#7e22ce';
      } else if (status === 'listening') {
        coreColor = '#fee2e2'; midColor = '#f87171'; outerColor = '#dc2626';
      } else if (status === 'speaking' || status === 'happy') {
        coreColor = '#ecfdf5'; midColor = '#34d399'; outerColor = '#059669';
      }

      // Draw Left Eye
      const eyeR = w * 0.18;
      const leftX = w * 0.32;
      const rightX = w * 0.68;
      const eyeY = h * 0.45;

      [leftX, rightX].forEach(cx => {
        const grad = ctx.createRadialGradient(cx, eyeY, eyeR * 0.1, cx, eyeY, eyeR);
        grad.addColorStop(0, coreColor);
        grad.addColorStop(0.4, midColor);
        grad.addColorStop(1, outerColor);
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (status === 'happy') {
          // Curved happy eye
          ctx.arc(cx, eyeY + 4, eyeR, Math.PI, Math.PI * 2);
        } else {
          ctx.arc(cx, eyeY, eyeR, 0, Math.PI * 2);
        }
        ctx.fill();

        // High-tech pupil highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - eyeR * 0.3, eyeY - eyeR * 0.3, eyeR * 0.25, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mouth / Jaw
      ctx.strokeStyle = midColor;
      ctx.lineWidth = w > 100 ? 3 : 1.5;
      ctx.beginPath();
      if (status === 'speaking') {
        ctx.arc(w / 2, h * 0.72, w * 0.12, 0, Math.PI);
      } else if (status === 'happy') {
        ctx.arc(w / 2, h * 0.70, w * 0.14, 0, Math.PI);
      } else {
        ctx.moveTo(w * 0.42, h * 0.75);
        ctx.lineTo(w * 0.58, h * 0.75);
      }
      ctx.stroke();
    }

    function setAiStatus(status) {
      aiStatus = status;
      pillDot.className = 'pill-status-dot ' + status;
      headerDot.className = 'pill-status-dot ' + status;
      headerStatusText.textContent = status.toUpperCase();
      document.getElementById('robotExpressionLabel').textContent = 'ROBO_DOG • ' + status.toUpperCase();

      drawRobotFace('pillCanvas', status);
      drawRobotFace('robotCanvas', status);

      // Animate waveform bars if speaking or listening
      const bars = document.querySelectorAll('.soundwave-bar');
      bars.forEach(b => {
        if (status === 'speaking' || status === 'listening') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }

    // Initial render of robot faces
    drawRobotFace('pillCanvas', 'idle');
    drawRobotFace('robotCanvas', 'idle');

    // Click on robot in stage makes him happy
    document.getElementById('robotStage').addEventListener('click', () => {
      setAiStatus('happy');
      showToast('HAPPY', 'Moco wagged tail! Happy to see you.');
      setTimeout(() => setAiStatus('idle'), 2500);
    });

    // --- Web Speech API Voice Recognition ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListening = true;
        setAiStatus('listening');
        pillMicBtn.classList.add('mic-active');
        headerMicBtn.classList.add('mic-active');
        pillSubtitle.textContent = 'Listening to voice command...';
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        pillSubtitle.textContent = 'Hearing: "' + transcript + '"';
      };

      recognition.onerror = (e) => {
        console.warn('Speech error:', e.error);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
        const cmd = pillSubtitle.textContent.replace('Hearing: "', '').replace('"', '').trim();
        if (cmd && !cmd.startsWith('AIBO_UNIT')) {
          handleVoiceCommand(cmd);
        }
      };
    }

    function startVoiceRecognition() {
      if (!recognition) {
        alert('Web Speech API is not supported in this browser. Please use Chrome or Edge.');
        return;
      }
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    }

    function stopListening() {
      isListening = false;
      pillMicBtn.classList.remove('mic-active');
      headerMicBtn.classList.remove('mic-active');
      setAiStatus('idle');
      pillSubtitle.textContent = 'AIBO_UNIT_01 • Click to expand';
    }

    pillMicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startVoiceRecognition();
    });

    headerMicBtn.addEventListener('click', () => {
      startVoiceRecognition();
    });

    // --- Execute Voice Command via Backend ---
    async function handleVoiceCommand(command) {
      setAiStatus('thinking');
      showToast('THINKING', 'Routing command: "' + command + '"');

      try {
        const res = await fetch('/api/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command })
        });
        const data = await res.json();

        // 1. If Navigation, immediately switch HUD tab!
        if (data.action === 'NAVIGATE' && data.target) {
          switchTab(data.target);
          showToast('NAVIGATE', data.reply);
          setAiStatus('happy');
          setTimeout(() => setAiStatus('idle'), 2000);
          return;
        }

        // 2. If Calculation, switch to calculator or post in chat!
        if (data.action === 'CALCULATE') {
          switchTab('calc');
          document.getElementById('calcResult').textContent = 'Result: ' + data.result;
          showToast('CALCULATE', data.reply);
          setAiStatus('speaking');
          setTimeout(() => setAiStatus('idle'), 2500);
          return;
        }

        // 3. If Chat or general, display in AI chat and speak!
        switchTab('chat');
        appendMessage('user', command);
        appendMessage('assistant', data.reply);
        showToast('MOCO AI', data.reply);
        setAiStatus('speaking');
        setTimeout(() => setAiStatus('idle'), 3000);

      } catch (err) {
        showToast('ERROR', err.message);
        setAiStatus('idle');
      }
    }

    function testVoiceCommand(cmd) {
      handleVoiceCommand(cmd);
    }

    function showToast(badge, text) {
      toastBadge.textContent = badge;
      toastText.textContent = text;
      voiceToast.classList.add('show');
      setTimeout(() => voiceToast.classList.remove('show'), 3500);
    }

    // --- Chat Form Submission with Real Ollama 4B Streaming ---
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';

      appendMessage('user', text);

      // Check if it's an explicit navigation or calculator command
      const lower = text.toLowerCase();
      if (/^(open|switch to|go to|show|view)\s+(pomodoro|todo|tasks|music|games)/i.test(lower)) {
        handleVoiceCommand(text);
        return;
      }

      setAiStatus('thinking');
      showToast('THINKING', 'Querying local Ollama 4B model...');

      const assistantMsg = appendMessage('assistant', '');
      let fullText = '';

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setAiStatus('speaking');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.chunk) {
                  fullText += parsed.chunk;
                  assistantMsg.textContent = fullText;
                  chatFeed.scrollTop = chatFeed.scrollHeight;
                }
              } catch (_) {}
            }
          }
        }

        setAiStatus('idle');
      } catch (err) {
        assistantMsg.textContent = `[Moco AI]: Ollama connection error: ${err.message}. Please verify 'ollama serve' is running.`;
        setAiStatus('idle');
      }
    });

    function appendMessage(role, text) {
      const msg = document.createElement('div');
      msg.className = 'message ' + role;
      msg.textContent = text;
      chatFeed.appendChild(msg);
      chatFeed.scrollTop = chatFeed.scrollHeight;
      return msg;
    }

    // --- Pomodoro Logic ---
    let pomoSeconds = 25 * 60;
    let pomoRunning = false;
    let pomoTimer = null;

    function setPomoMode(mode) {
      pomoRunning = false;
      clearInterval(pomoTimer);
      pomoSeconds = mode === 'work' ? 25 * 60 : 5 * 60;
      updatePomoDisplay();
      document.querySelectorAll('.pomo-mode-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.toLowerCase().includes(mode));
      });
      document.getElementById('pomoToggleBtn').textContent = 'Start Focus';
    }

    function updatePomoDisplay() {
      const m = Math.floor(pomoSeconds / 60);
      const s = pomoSeconds % 60;
      document.getElementById('pomoTime').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function togglePomodoro() {
      pomoRunning = !pomoRunning;
      if (pomoRunning) {
        document.getElementById('pomoToggleBtn').textContent = 'Pause';
        pomoTimer = setInterval(() => {
          if (pomoSeconds > 0) {
            pomoSeconds--;
            updatePomoDisplay();
          } else {
            clearInterval(pomoTimer);
            pomoRunning = false;
            showToast('POMODORO', 'Session complete! Take a break.');
            document.getElementById('pomoToggleBtn').textContent = 'Start Focus';
          }
        }, 1000);
      } else {
        clearInterval(pomoTimer);
        document.getElementById('pomoToggleBtn').textContent = 'Resume';
      }
    }

    function resetPomodoro() {
      clearInterval(pomoTimer);
      pomoRunning = false;
      pomoSeconds = 25 * 60;
      updatePomoDisplay();
      document.getElementById('pomoToggleBtn').textContent = 'Start Focus';
    }

    // --- Todo Queue Logic ---
    let todos = [
      { id: 1, text: 'Design 3D hologram shader', done: true },
      { id: 2, text: 'Hook voice commands to HUD tabs', done: true },
      { id: 3, text: 'Test local Ollama Gemma integration', done: false }
    ];

    function renderTodos() {
      const list = document.getElementById('todoList');
      list.innerHTML = '';
      todos.forEach(t => {
        const item = document.createElement('div');
        item.className = 'todo-item' + (t.done ? ' completed' : '');
        item.innerHTML = \`
          <div class="todo-left" onclick="toggleTodo(\${t.id})">
            <div class="todo-checkbox">\${t.done ? '✓' : ''}</div>
            <span>\${t.text}</span>
          </div>
          <button style="background:none;border:none;color:#94a3b8;cursor:pointer;" onclick="deleteTodo(\${t.id})">✕</button>
        \`;
        list.appendChild(item);
      });
      const doneCount = todos.filter(t => t.done).length;
      document.getElementById('todoCounter').textContent = doneCount + '/' + todos.length + ' Completed';
    }

    window.toggleTodo = (id) => {
      todos = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
      renderTodos();
    };

    window.deleteTodo = (id) => {
      todos = todos.filter(t => t.id !== id);
      renderTodos();
    };

    document.getElementById('todoForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = document.getElementById('todoInput');
      if (!inp.value.trim()) return;
      todos.push({ id: Date.now(), text: inp.value.trim(), done: false });
      inp.value = '';
      renderTodos();
    });

    renderTodos();

    // --- Music Toggle ---
    let isPlayingMusic = false;
    function toggleMusic() {
      isPlayingMusic = !isPlayingMusic;
      const disc = document.getElementById('musicDisc');
      const btn = document.getElementById('musicPlayBtn');
      if (isPlayingMusic) {
        disc.classList.add('playing');
        btn.textContent = '⏸ Pause Audio';
        setAiStatus('speaking');
        showToast('MUSIC', 'Now playing: Midnight Coding Session');
      } else {
        disc.classList.remove('playing');
        btn.textContent = '▶ Play Audio';
        setAiStatus('idle');
      }
    }

    // --- Calculator Graph Plotter ---
    function plotGraph(fn) {
      fetch('/api/math/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fn, xMin: -6, xMax: 6, sampleCount: 60 })
      })
      .then(r => r.json())
      .then(data => {
        drawGraphOnCanvas(data.points, data.roots);
      })
      .catch(console.error);
    }

    function drawGraphOnCanvas(points, roots) {
      const c = document.getElementById('graphCanvas');
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, c.height / 2); ctx.lineTo(c.width, c.height / 2);
      ctx.moveTo(c.width / 2, 0); ctx.lineTo(c.width / 2, c.height);
      ctx.stroke();

      if (!points || !points.length) return;

      // Plot curve
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const scaleX = c.width / 12;
      const scaleY = 25;

      points.forEach((p, i) => {
        if (p.y === null) return;
        const cx = c.width / 2 + p.x * scaleX;
        const cy = c.height / 2 - p.y * scaleY;
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      if (roots && roots.length) {
        document.getElementById('calcResult').textContent = 'Roots f(x)=0 at x: ' + roots.map(r => r.toFixed(2)).join(', ');
      }
    }

    // --- Device Battery Telemetry ---
    async function updateBatteryIndicator() {
      try {
        let percent = null;
        let isCharging = false;

        if (navigator.getBattery) {
          try {
            const b = await navigator.getBattery();
            percent = Math.round(b.level * 100);
            isCharging = b.charging;
            b.onlevelchange = () => updateBatteryIndicator();
            b.onchargingchange = () => updateBatteryIndicator();
          } catch (_) {}
        }

        if (percent === null) {
          const res = await fetch('/api/system/battery');
          const data = await res.json();
          if (data && data.hasBattery) {
            percent = data.percent;
            isCharging = data.isCharging;
          }
        }

        if (percent !== null) {
          const textEl = document.getElementById('batteryPercentText');
          const badgeEl = document.getElementById('batteryBadge');
          if (textEl) textEl.textContent = percent + '%';
          if (badgeEl) badgeEl.title = 'Device Battery: ' + percent + '%' + (isCharging ? ' (Charging ⚡)' : '');
        }
      } catch (_) {}
    }
    updateBatteryIndicator();
    setInterval(updateBatteryIndicator, 30000);
  </script>
</body>
</html>`;
}

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Moco.AI HUD Local Web Server running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`======================================================\n`);
  console.log(`Open http://localhost:${PORT} in your web browser (Chrome/Edge)!`);
});
