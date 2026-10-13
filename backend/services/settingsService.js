import electron from 'electron';
const { app } = electron;
import { getItem, setItem } from './storageService.js';

/**
 * Manages Windows Open on Startup (Login item settings)
 */
export function getStartupSetting() {
  try {
    const loginSettings = app.getLoginItemSettings();
    const stored = getItem('openAtLogin', false);
    return { openAtLogin: Boolean(loginSettings.openAtLogin || stored) };
  } catch (err) {
    console.error('Failed to get startup setting:', err);
    return { openAtLogin: false };
  }
}

export function setStartupSetting(openAtLogin) {
  try {
    const enabled = Boolean(openAtLogin);
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false
    });
    setItem('openAtLogin', enabled);
    return { success: true, openAtLogin: enabled };
  } catch (err) {
    console.error('Failed to set startup setting:', err);
    return { success: false, error: err.message };
  }
}
