import { ipcMain, Notification } from 'electron';
import { generateStreamingResponse, checkOllamaHealth } from '../services/ollamaService.js';
import { getItem, setItem } from '../services/storageService.js';

export function setupIpcHandlers(mainWindow) {
  // Check Ollama connectivity & available models
  ipcMain.handle('ai:health', async () => {
    return checkOllamaHealth();
  });

  // Handle AI prompt streaming via local Ollama
  ipcMain.on('ai:prompt', async (event, { prompt, channelId }) => {
    try {
      const onStatus = (status) => {
        mainWindow.webContents.send('ai:status-change', status);
      };

      const onChunk = (chunk) => {
        event.sender.send(channelId, { chunk, done: false });
      };

      await generateStreamingResponse(prompt, onChunk, onStatus);
      event.sender.send(channelId, { chunk: '', done: true });
    } catch (err) {
      event.sender.send(channelId, { error: err.message, done: true });
    }
  });

  // Window controls
  ipcMain.on('window:hide', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  });

  let isPinned = false;
  ipcMain.handle('window:pin', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      isPinned = !isPinned;
      mainWindow.setAlwaysOnTop(isPinned);
      return isPinned;
    }
    return false;
  });

  // Storage handlers
  ipcMain.handle('storage:get', (event, { key, defaultValue }) => {
    return getItem(key, defaultValue);
  });

  ipcMain.handle('storage:set', (event, { key, value }) => {
    return setItem(key, value);
  });

  // System notification
  ipcMain.on('system:notify', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });
}
