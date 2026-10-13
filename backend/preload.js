import { contextBridge, ipcRenderer } from 'electron';

// Expose safe, isolated API to the frontend renderer process
contextBridge.exposeInMainWorld('mocoApi', {
  // AI Chat
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

  // AI Status Listener for 3D Avatar/Visualizer
  onAIStatus: (callback) => {
    const handler = (event, status) => callback(status);
    ipcRenderer.on('ai:status-change', handler);
    return () => ipcRenderer.removeListener('ai:status-change', handler);
  },

  // Window Controls
  hideWindow: () => ipcRenderer.send('window:hide'),
  togglePin: () => ipcRenderer.invoke('window:pin'),

  // Storage (Todos, Settings, Pomodoro)
  getStorage: (key, defaultValue) => ipcRenderer.invoke('storage:get', { key, defaultValue }),
  setStorage: (key, value) => ipcRenderer.invoke('storage:set', { key, value }),

  // Notification
  notify: (title, body) => ipcRenderer.send('system:notify', { title, body })
});
