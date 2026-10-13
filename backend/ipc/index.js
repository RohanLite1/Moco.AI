import electron from 'electron';
const { ipcMain, Notification } = electron;

import { generateStreamingResponse, checkOllamaHealth, clearConversationHistory } from '../services/ollamaService.js';
import { evaluateExpression, generateGraphData } from '../services/mathService.js';
import { ChessGame } from '../services/gameEngines/chessEngine.js';
import { CheckersGame } from '../services/gameEngines/checkersEngine.js';
import { TetrisGame } from '../services/gameEngines/tetrisEngine.js';
import { SnakeGame } from '../services/gameEngines/snakeEngine.js';
import { translateText } from '../services/translatorService.js';
import { capturePrimaryScreen, analyzeScreen } from '../services/screenService.js';
import { getItem, setItem } from '../services/storageService.js';

// Stateful game instances per session
let activeChess = new ChessGame();
let activeCheckers = new CheckersGame();
let activeTetris = new TetrisGame();
let activeSnake = new SnakeGame();

export function setupIpcHandlers(mainWindow) {
  // --- 1. AI Chat & Memory ---
  ipcMain.handle('ai:health', async () => {
    return checkOllamaHealth();
  });

  ipcMain.handle('ai:clear-history', async () => {
    return clearConversationHistory();
  });

  ipcMain.on('ai:prompt', async (event, { prompt, channelId }) => {
    try {
      const onStatus = (status) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ai:status-change', status);
        }
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

  // --- 2. Focus: Mathematics & Graphing ---
  ipcMain.handle('math:evaluate', async (event, { expression }) => {
    return evaluateExpression(expression);
  });

  ipcMain.handle('math:graph', async (event, { fn, xMin = -10, xMax = 10, sampleCount = 200 }) => {
    return generateGraphData(fn, xMin, xMax, sampleCount);
  });

  // --- 3. Fun: Game Engines ---
  // Chess
  ipcMain.handle('game:chess:init', () => {
    activeChess = new ChessGame();
    return { board: activeChess.board, turn: activeChess.turn };
  });

  ipcMain.handle('game:chess:move', (event, { move }) => {
    return activeChess.makeMove(move);
  });

  ipcMain.handle('game:chess:bot', () => {
    const botMove = activeChess.getBotMove();
    if (botMove) {
      activeChess.makeMove(botMove);
      return { botMove, board: activeChess.board, turn: activeChess.turn };
    }
    return { botMove: null };
  });

  // Checkers
  ipcMain.handle('game:checkers:move', (event, { move }) => {
    const res = activeCheckers.makeMove(move);
    const botMove = activeCheckers.getBotMove();
    if (botMove) {
      activeCheckers.makeMove(botMove);
    }
    return { board: activeCheckers.board, turn: activeCheckers.turn, botMove };
  });

  // Tetris
  ipcMain.handle('game:tetris:action', (event, { action }) => {
    if (action === 'new') {
      activeTetris = new TetrisGame();
      return { grid: activeTetris.grid, currentPiece: activeTetris.currentPiece };
    } else if (action === 'left') {
      activeTetris.moveLeft();
    } else if (action === 'right') {
      activeTetris.moveRight();
    } else if (action === 'rotate') {
      activeTetris.rotatePiece();
    } else if (action === 'drop') {
      activeTetris.hardDrop();
    } else {
      activeTetris.tick();
    }
    return {
      grid: activeTetris.grid,
      currentPiece: activeTetris.currentPiece,
      score: activeTetris.score,
      gameOver: activeTetris.gameOver
    };
  });

  // Snake
  ipcMain.handle('game:snake:action', (event, { action }) => {
    if (action === 'new') {
      activeSnake = new SnakeGame();
      return { snake: activeSnake.snake, food: activeSnake.food, score: 0 };
    }
    if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(action)) {
      activeSnake.setDirection(action);
    }
    return activeSnake.tick();
  });

  // --- 4. Screen Analysis & Translator ---
  ipcMain.handle('screen:capture', async () => {
    return capturePrimaryScreen();
  });

  ipcMain.handle('screen:analyze', async (event, { prompt }) => {
    return analyzeScreen(prompt);
  });

  ipcMain.handle('translate:text', async (event, { text, targetLanguage }) => {
    return translateText(text, targetLanguage);
  });

  // --- Window controls ---
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

  // --- Storage handlers ---
  ipcMain.handle('storage:get', (event, { key, defaultValue }) => {
    return getItem(key, defaultValue);
  });

  ipcMain.handle('storage:set', (event, { key, value }) => {
    return setItem(key, value);
  });

  // --- System notification ---
  ipcMain.on('system:notify', (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });
}
