/**
 * Shared API Contract for Moco.AI
 * Both Backend and Frontend conform to these method signatures and IPC channels.
 */

export const IPC_CHANNELS = {
  // 1. AI Chat & Memory
  AI_PROMPT: 'ai:prompt',
  AI_STATUS_CHANGE: 'ai:status-change',
  AI_CLEAR_HISTORY: 'ai:clear-history',
  AI_HEALTH: 'ai:health',

  // 2. Focus & Mathematics
  MATH_EVALUATE: 'math:evaluate',
  MATH_GRAPH: 'math:graph',

  // 3. Games Engines
  GAME_CHESS_INIT: 'game:chess:init',
  GAME_CHESS_MOVE: 'game:chess:move',
  GAME_CHESS_BOT: 'game:chess:bot',
  GAME_CHECKERS_MOVE: 'game:checkers:move',
  GAME_TETRIS_ACTION: 'game:tetris:action',
  GAME_SNAKE_ACTION: 'game:snake:action',

  // 4. Screen Analysis & Translator
  SCREEN_CAPTURE: 'screen:capture',
  SCREEN_ANALYZE: 'screen:analyze',
  // Screen & System
  TRANSLATE_TEXT: 'translate:text',
  VOICE_LISTEN_NATIVE: 'voice:listen-native',
  VOICE_STOP_NATIVE: 'voice:stop-native',

  // Window & System
  WINDOW_TOGGLE: 'window:toggle',
  WINDOW_HIDE: 'window:hide',
  WINDOW_PIN: 'window:pin',

  // Data Persistence
  STORAGE_GET: 'storage:get',
  STORAGE_SET: 'storage:set',
  SYSTEM_NOTIFICATION: 'system:notify'
};

/**
 * Expected window.mocoApi signatures:
 * 
 * --- AI Chat ---
 * - askAI(prompt: string, callback: (chunk: string) => void): Promise<string>
 * - clearAIHistory(): Promise<boolean>
 * - checkAIHealth(): Promise<{ online: boolean, models: string[] }>
 * - onAIStatus(callback: (status: 'idle' | 'thinking' | 'speaking') => void): () => void
 * 
 * --- Focus: Math & Desmos Graphing ---
 * - evaluateMath(expression: string): Promise<{ result: number, formatted: string, error?: string }>
 * - generateGraphData(fn: string, xMin?: number, xMax?: number, samples?: number): Promise<{ points: {x,y}[], roots: number[] }>
 * 
 * --- Fun: Games ---
 * - chessMove(move: {from: {r,c}, to: {r,c}}): Promise<{ success: boolean, board: string[][], turn: string }>
 * - chessBotMove(): Promise<{ from: {r,c}, to: {r,c} }>
 * - tetrisAction(action: 'tick' | 'left' | 'right' | 'rotate' | 'drop'): Promise<any>
 * - snakeAction(action: 'tick' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): Promise<any>
 * 
 * --- Screen & Navigation ---
 * - captureScreen(): Promise<{ dataUrl: string, resolution: {width, height} }>
 * - analyzeScreen(prompt?: string): Promise<{ capture: any, analysis: string }>
 * - translate(text: string, targetLanguage: string): Promise<{ translation: string }>
 * - searchWeb(query: string): Promise<{ success: boolean, action: string, reply: string, data?: any }>
 * - getWeather(location?: string): Promise<{ success: boolean, location: string, summary: string }>
 * - getDeviceBattery(): Promise<{ hasBattery: boolean, percent: number, isCharging: boolean }>
 * 
 * --- Settings & Open on Startup ---
 * - getStartupSetting(): Promise<{ openAtLogin: boolean }>
 * - setStartupSetting(openAtLogin: boolean): Promise<{ success: boolean, openAtLogin: boolean }>
 * 
 * --- Floating Dog Logo Mascot ---
 * - toggleMascot(enable: boolean): Promise<boolean>
 * - mascotHover(isHovered: boolean): void
 * - mascotClick(): void
 * 
 * --- Autonomous Voice Agent (No TTS, action & tool routing) ---
 * - processVoiceCommand(command: string): Promise<{ success: boolean, action: string, reply: string, target?: string, data?: any }>
 * - listenNativeVoice(): Promise<{ success: boolean, text: string, error?: string }>
 * - stopNativeVoice(): void
 * - onVoiceNavigate(callback: (targetTab: string) => void): () => void
 * 
 * --- System & Storage ---
 * - closeApp(): void
 * - hideWindow(): void
 * - togglePin(): Promise<boolean>
 * - getStorage(key: string, defaultValue?: any): Promise<any>
 * - setStorage(key: string, value: any): Promise<boolean>
 * - notify(title: string, body: string): void
 */
