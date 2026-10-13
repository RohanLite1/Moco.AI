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

let statusListeners = [];
let currentStatus = 'idle';

export const mockApi = {
  askAI: async (prompt, onChunk) => {
    // Notify listeners: thinking
    currentStatus = 'thinking';
    statusListeners.forEach(cb => cb('thinking'));
    await new Promise(r => setTimeout(r, 600));

    // Notify listeners: speaking
    currentStatus = 'speaking';
    statusListeners.forEach(cb => cb('speaking'));

    const sampleReplies = [
      `Greetings! I am Moco. You asked: "${prompt}". I've scheduled your next focus block and your tasks are synchronized.`,
      `Analysis complete. The current system metrics look nominal, and your productivity timer is running smoothly!`,
      `[Moco Assistant]: Processing query. Here is a recommendation: prioritize high-impact tasks first, take 5-minute pomodoro breaks, and stay hydrated!`
    ];

    const reply = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
    const words = reply.split(' ');
    
    for (const word of words) {
      if (onChunk) onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 50));
    }

    currentStatus = 'idle';
    statusListeners.forEach(cb => cb('idle'));
    return reply;
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

  onVoiceNavigate: (callback) => {
    return () => {};
  }
};
