import { mockApi } from './mockApi.js';

// Automatically choose between real Electron IPC bridge or mock development API
const isElectron = typeof window !== 'undefined' && Boolean(window.mocoApi);

export const api = isElectron ? window.mocoApi : mockApi;

if (!isElectron) {
  console.info('%c[Moco.AI] Running in Browser Mode: using mockApi fallback.', 'color: #06b6d4; font-weight: bold;');
} else {
  console.info('%c[Moco.AI] Running in Desktop Mode: connected to Electron IPC.', 'color: #10b981; font-weight: bold;');
}
