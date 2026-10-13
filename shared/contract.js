/**
 * Shared API Contract for Moco.AI
 * Both Backend and Frontend conform to these method signatures and IPC channels.
 */

export const IPC_CHANNELS = {
  // AI Chat
  AI_PROMPT: 'ai:prompt',
  AI_STREAM_CHUNK: 'ai:stream-chunk',
  AI_STATUS_CHANGE: 'ai:status-change',

  // Window & System
  WINDOW_TOGGLE: 'window:toggle',
  WINDOW_HIDE: 'window:hide',
  WINDOW_PIN: 'window:pin',

  // Data Persistence (Todos, Settings, etc.)
  STORAGE_GET: 'storage:get',
  STORAGE_SET: 'storage:set',

  // System Audio / Notification
  SYSTEM_NOTIFICATION: 'system:notify'
};

/**
 * Expected window.mocoApi methods:
 * 
 * - window.mocoApi.askAI(prompt: string, callback: (chunk: string, done: boolean) => void): Promise<string>
 * - window.mocoApi.onAIStatus(callback: (status: 'idle' | 'thinking' | 'speaking') => void): () => void
 * - window.mocoApi.hideWindow(): void
 * - window.mocoApi.togglePin(): Promise<boolean>
 * - window.mocoApi.getStorage(key: string, defaultValue?: any): Promise<any>
 * - window.mocoApi.setStorage(key: string, value: any): Promise<boolean>
 * - window.mocoApi.notify(title: string, body: string): void
 */
