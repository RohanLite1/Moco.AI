import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;

// Expose complete safe API bridge to frontend renderer conforming to shared/contract.js
contextBridge.exposeInMainWorld('mocoApi', {
  // 1. AI Chat & Memory
  askAI: (prompt, onChunk) => {
    return new Promise((resolve, reject) => {
      const channelId = `stream_${Date.now()}_${Math.random()}`;
      
      const chunkHandler = (event, { chunk, done, error }) => {
        if (error) {
          ipcRenderer.removeListener(channelId, chunkHandler);
          reject(new Error(error));
        } else if (done) {
          ipcRenderer.removeListener(channelId, chunkHandler);
          resolve(chunk);
        } else if (onChunk) {
          onChunk(chunk);
        }
      };

      ipcRenderer.on(channelId, chunkHandler);
      ipcRenderer.send('ai:prompt', { prompt, channelId });
    });
  },

  clearAIHistory: () => ipcRenderer.invoke('ai:clear-history'),
  checkAIHealth: () => ipcRenderer.invoke('ai:health'),

  // AI Status Listener for 3D Hologram Orb
  onAIStatus: (callback) => {
    const handler = (event, status) => callback(status);
    ipcRenderer.on('ai:status-change', handler);
    return () => ipcRenderer.removeListener('ai:status-change', handler);
  },

  // 2. Focus: Math & Desmos Graphing
  evaluateMath: (expression) => ipcRenderer.invoke('math:evaluate', { expression }),
  generateGraphData: (fn, xMin, xMax, sampleCount) =>
    ipcRenderer.invoke('math:graph', { fn, xMin, xMax, sampleCount }),

  // 3. Fun: Game Engines
  chessInit: () => ipcRenderer.invoke('game:chess:init'),
  chessMove: (move) => ipcRenderer.invoke('game:chess:move', { move }),
  chessBotMove: () => ipcRenderer.invoke('game:chess:bot'),
  checkersMove: (move) => ipcRenderer.invoke('game:checkers:move', { move }),
  tetrisAction: (action) => ipcRenderer.invoke('game:tetris:action', { action }),
  snakeAction: (action) => ipcRenderer.invoke('game:snake:action', { action }),

  // 4. Screen Analysis & Translator
  captureScreen: () => ipcRenderer.invoke('screen:capture'),
  analyzeScreen: (prompt) => ipcRenderer.invoke('screen:analyze', { prompt }),
  translate: (text, targetLanguage) => ipcRenderer.invoke('translate:text', { text, targetLanguage }),

  // 5. Settings & Open on Startup
  getStartupSetting: () => ipcRenderer.invoke('settings:get-startup'),
  setStartupSetting: (openAtLogin) => ipcRenderer.invoke('settings:set-startup', { openAtLogin }),

  // 6. Floating Dog Logo Mascot
  toggleMascot: (enable) => ipcRenderer.invoke('mascot:toggle', { enable }),
  mascotHover: (isHovered) => ipcRenderer.send('mascot:hover', isHovered),
  mascotClick: () => ipcRenderer.send('mascot:click'),

  // Window Controls
  closeApp: () => ipcRenderer.send('window:close'),
  hideWindow: () => ipcRenderer.send('window:hide'),
  togglePin: () => ipcRenderer.invoke('window:pin'),

  // Storage (Todos, Settings, History)
  getStorage: (key, defaultValue) => ipcRenderer.invoke('storage:get', { key, defaultValue }),
  setStorage: (key, value) => ipcRenderer.invoke('storage:set', { key, value }),

  // System Notification
  notify: (title, body) => ipcRenderer.send('system:notify', { title, body })
});
