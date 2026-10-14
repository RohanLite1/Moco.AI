/**
 * Mock API for Frontend Standalone Development
 * Used when running `npm run dev:frontend` in a standard browser.
 */

const mockStorage = {
  todos: [
    { id: 1, text: "Finish hackathon presentation pitch", completed: false },
    { id: 2, text: "Hook up 3D Three.js hologram shader", completed: true },
    { id: 3, text: "Test Gemini streaming responses", completed: false }
  ],
  pomodoro: { workMinutes: 25, breakMinutes: 5, sessionsCompleted: 3 }
};

const OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma3:4b';

let conversationHistory = [];
let statusListeners = [];
let currentStatus = 'idle';

function getSystemPrompt() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  return {
    role: 'system',
    content: `You are Moco, a friendly, sharp, and helpful desktop AI companion.
Current Real-Time Context:
- Today's Date: ${dateStr}
- Current Time: ${timeStr} (${timeZone})

Guidelines:
- Speak naturally, warmly, and concisely like a smart friend.
- When asked about the date, day, or time, always answer accurately using the Current Real-Time Context above.
- Never use cold, robotic phrases like "Query received" or "Processing request".
- When greeted with "hey", "hi", "hello", or similar greetings, respond warmly and ask how you can help.
- Give accurate, clear, and direct answers formatted nicely for a desktop HUD.
- Keep responses concise unless the user explicitly asks for detailed explanations.`
  };
}

export const mockApi = {
  askAI: async (prompt, onChunk) => {
    // Notify listeners: thinking
    currentStatus = 'thinking';
    statusListeners.forEach(cb => cb('thinking'));

    try {
      // 1. Try streaming directly from local Ollama (4B parameter model)
      conversationHistory.push({ role: 'user', content: prompt });
      if (conversationHistory.length > 16) {
        conversationHistory = conversationHistory.slice(-16);
      }

      const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [getSystemPrompt(), ...conversationHistory],
          stream: true,
          options: {
            temperature: 0.7
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }

      currentStatus = 'speaking';
      statusListeners.forEach(cb => cb('speaking'));

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            const chunk = parsed.message?.content || parsed.response;
            if (chunk) {
              fullText += chunk;
              if (onChunk) onChunk(chunk);
            }
          } catch (_) {}
        }
      }

      if (fullText) {
        conversationHistory.push({ role: 'assistant', content: fullText });
      }

      currentStatus = 'idle';
      statusListeners.forEach(cb => cb('idle'));
      return fullText;
    } catch (ollamaErr) {
      console.warn('[Mock API] Direct Ollama call failed, attempting dev-server on :3001...', ollamaErr);

      // 2. Try dev-server /api/chat if running
      try {
        const sseRes = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });

        if (sseRes.ok) {
          currentStatus = 'speaking';
          statusListeners.forEach(cb => cb('speaking'));

          const reader = sseRes.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let fullText = '';
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
                  const data = JSON.parse(line.slice(6));
                  if (data.chunk) {
                    fullText += data.chunk;
                    if (onChunk) onChunk(data.chunk);
                  }
                } catch (_) {}
              }
            }
          }

          currentStatus = 'idle';
          statusListeners.forEach(cb => cb('idle'));
          return fullText;
        }
      } catch (_) {}

      // 3. Fallback: Offline guidance
      currentStatus = 'idle';
      statusListeners.forEach(cb => cb('idle'));
      const fallbackMsg = `[Moco AI]: Cannot connect to local Ollama (model: ${DEFAULT_MODEL}) at ${OLLAMA_HOST}.\n\nPlease ensure Ollama is running in PowerShell with:\nollama run ${DEFAULT_MODEL}`;
      if (onChunk) onChunk(fallbackMsg);
      return fallbackMsg;
    }
  },

  clearAIHistory: async () => {
    conversationHistory = [];
    return true;
  },

  checkAIHealth: async () => {
    try {
      const res = await fetch(`${OLLAMA_HOST}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        return {
          online: true,
          models: data.models?.map(m => m.name) || []
        };
      }
    } catch (_) {}
    return { online: false, models: [] };
  },

  onAIStatus: (callback) => {
    statusListeners.push(callback);
    callback(currentStatus);
    return () => {
      statusListeners = statusListeners.filter(cb => cb !== callback);
    };
  },

  hideWindow: () => {
    console.log('[Mock API] Window hide triggered');
  },

  togglePin: async () => {
    console.log('[Mock API] Toggle pin triggered');
    return true;
  },

  getStorage: async (key, defaultValue = null) => {
    return mockStorage[key] !== undefined ? mockStorage[key] : defaultValue;
  },

  setStorage: async (key, value) => {
    mockStorage[key] = value;
    return true;
  },

  notify: (title, body) => {
    console.log(`[Mock Notification] ${title}: ${body}`);
  },

  processVoiceCommand: async (command) => {
    try {
      const res = await fetch('http://localhost:3001/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Backend offline, fallback to built-in rules
    }

    const lower = (command || '').toLowerCase();
    if (
      (/\b(date|day)\b/i.test(lower) && /\b(what|today|current|tell|which|now)\b/i.test(lower)) ||
      /\b(today'?s date|current date|what day is (it|today))\b/i.test(lower)
    ) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return { success: true, action: 'CHAT', reply: `Today is ${dateStr}.` };
    }

    if (
      (/\b(time)\b/i.test(lower) && /\b(what|current|tell|now)\b/i.test(lower)) ||
      /\b(what('s| is) (the )?time( now)?|current time|what time is it)\b/i.test(lower)
    ) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return { success: true, action: 'CHAT', reply: `The current time is ${timeStr}.` };
    }

    if (/\b(dance|do a dance|groove|start dancing)\b/i.test(lower)) {
      return { success: true, action: 'ROBOT_ACTION', target: 'dance', reply: 'Starting dance mode!' };
    }
    if (/\b(spin|spin around|do a 360|do a spin|turn around)\b/i.test(lower)) {
      return { success: true, action: 'ROBOT_ACTION', target: 'spin', reply: '360 gyroscopic spin!' };
    }
    if (/\b(wave|wave at me|wave paws|say hi|wave your hand|say hello)\b/i.test(lower)) {
      return { success: true, action: 'ROBOT_ACTION', target: 'wave', reply: 'Hello! Waving at you!' };
    }
    if (/\b(cheer|celebrate|hooray|yay|do a cheer|good dog|good boy|good robot)\b/i.test(lower)) {
      return { success: true, action: 'ROBOT_ACTION', target: 'cheer', reply: 'Hooray! Celebrating with you!' };
    }

    if (/\b(pomodoro|timer|focus)\b/i.test(lower)) {
      return { success: true, action: 'NAVIGATE', target: 'pomodoro', reply: 'Switching to Pomodoro Focus timer.' };
    }
    if (/\b(todo|tasks|task list|checklist)\b/i.test(lower)) {
      return { success: true, action: 'NAVIGATE', target: 'todo', reply: 'Opening your task queue.' };
    }
    if (/\b(music|waves|lofi|ambient)\b/i.test(lower)) {
      return { success: true, action: 'NAVIGATE', target: 'music', reply: 'Switching to Ambient Waves player.' };
    }
    if (/\b(games|game|chess|tetris|snake)\b/i.test(lower)) {
      return { success: true, action: 'NAVIGATE', target: 'games', reply: 'Opening Games arcade.' };
    }
    if (/\b(chat|assistant|moco)\b/i.test(lower)) {
      return { success: true, action: 'NAVIGATE', target: 'chat', reply: 'Returning to AI Assistant chat.' };
    }
    return { success: true, action: 'CHAT', reply: `Moco heard: "${command}"` };
  },

  searchWeb: async (query) => {
    try {
      const res = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true, reply: `Found live search results for "${query}"` };
  },

  getWeather: async (location) => {
    try {
      const res = await fetch('http://localhost:3001/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true, summary: `Weather data for ${location || 'local'}` };
  },

  getDeviceBattery: async () => {
    try {
      const res = await fetch('http://localhost:3001/api/system/battery');
      if (res.ok) return await res.json();
    } catch (_) {}
    return { hasBattery: true, percent: 100, isCharging: true };
  },

  onVoiceNavigate: (callback) => {
    return () => {};
  },

  listenNativeVoice: async () => {
    try {
      const res = await fetch('http://localhost:3001/api/speech/listen', { method: 'POST' });
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: false, text: '' };
  },

  stopNativeVoice: async () => {
    try {
      await fetch('http://localhost:3001/api/speech/stop', { method: 'POST' });
    } catch (_) {}
  }
};
