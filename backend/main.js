import electron from 'electron';
const { app, BrowserWindow, globalShortcut, screen } = electron;
import path from 'path';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipc/index.js';
import { getStartupSetting } from './services/settingsService.js';
import { createMascotWindow } from './services/mascotService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1050, Math.floor(width * 0.85)),
    height: Math.min(720, Math.floor(height * 0.85)),
    show: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Setup backend IPC handlers
  setupIpcHandlers(mainWindow);

  // Load URL (Vite dev server in dev, or local index.html in production build)
  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
  if (isDev) {
    // Wait briefly for Vite server if needed
    const loadDev = async (retries = 10) => {
      try {
        await mainWindow.loadURL('http://localhost:5173');
      } catch (err) {
        if (retries > 0) {
          setTimeout(() => loadDev(retries - 1), 500);
        } else {
          console.error('Could not connect to Vite dev server:', err);
        }
      }
    };
    loadDev();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'frontend/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Global shortcut to toggle overlay HUD
  // Shortcut: Alt + Space (or Ctrl + Shift + Space on Windows)
  const shortcut = 'Alt+Space';
  const registered = globalShortcut.register(shortcut, () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  if (!registered) {
    console.warn(`Global shortcut ${shortcut} registration failed.`);
  } else {
    console.log(`Global shortcut registered: ${shortcut}`);
  }
}

app.whenReady().then(() => {
  createWindow();

  // If open on startup is enabled, spawn the floating dog logo mascot
  const startup = getStartupSetting();
  if (startup.openAtLogin) {
    createMascotWindow(mainWindow);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
