import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gamepad2,
  RotateCcw,
  Play,
  Pause,
  ChevronLeft,
  Trophy,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  RotateCw,
  Sparkles,
  Award,
  Zap,
  Target
} from 'lucide-react';
import '../styles/games.css';

/* ========================================================================= */
/* TETRIS ENGINE CONSTANTS & HELPERS                                         */
/* ========================================================================= */
const TETRIS_ROWS = 20;
const TETRIS_COLS = 10;

const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#06b6d4', // Cyan
    glow: 'rgba(6, 182, 212, 0.6)'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#eab308', // Amber/Yellow
    glow: 'rgba(234, 179, 8, 0.6)'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a855f7', // Purple
    glow: 'rgba(168, 85, 247, 0.6)'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#22c55e', // Emerald
    glow: 'rgba(34, 197, 94, 0.6)'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#f43f5e', // Rose
    glow: 'rgba(244, 63, 94, 0.6)'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#3b82f6', // Blue
    glow: 'rgba(59, 130, 246, 0.6)'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f97316', // Orange
    glow: 'rgba(249, 115, 22, 0.6)'
  }
};

const TETRO_KEYS = Object.keys(TETROMINOES);

function getRandomTetromino() {
  const key = TETRO_KEYS[Math.floor(Math.random() * TETRO_KEYS.length)];
  return {
    key,
    shape: TETROMINOES[key].shape,
    color: TETROMINOES[key].color,
    glow: TETROMINOES[key].glow
  };
}

function createEmptyGrid() {
  return Array.from({ length: TETRIS_ROWS }, () => Array(TETRIS_COLS).fill(null));
}

function rotateMatrix(matrix) {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

function checkCollision(grid, piece, pos) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const newY = pos.y + r;
        const newX = pos.x + c;
        if (newX < 0 || newX >= TETRIS_COLS || newY >= TETRIS_ROWS) {
          return true;
        }
        if (newY >= 0 && grid[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

/* ========================================================================= */
/* CHESS ENGINE CONSTANTS & HELPERS                                          */
/* ========================================================================= */
const INITIAL_CHESS_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const CHESS_SYMBOLS = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

const PIECE_NAMES = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn'
};

function isWhite(piece) {
  return piece && piece === piece.toUpperCase();
}

function getChessMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const white = isWhite(piece);
  const type = piece.toLowerCase();
  const moves = [];

  const addIfValid = (r, c) => {
    if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
    const dest = board[r][c];
    if (!dest) {
      moves.push({ r, c, capture: false });
      return true;
    }
    if (isWhite(dest) !== white) {
      moves.push({ r, c, capture: true });
    }
    return false; // Blocked
  };

  if (type === 'p') {
    const dir = white ? -1 : 1;
    const startRow = white ? 6 : 1;
    // Step 1 forward
    if (row + dir >= 0 && row + dir < 8 && !board[row + dir][col]) {
      moves.push({ r: row + dir, c: col, capture: false });
      // Step 2 forward from start
      if (row === startRow && !board[row + dir * 2][col]) {
        moves.push({ r: row + dir * 2, c: col, capture: false });
      }
    }
    // Diagonal captures
    [-1, 1].forEach(dc => {
      const nr = row + dir;
      const nc = col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const dest = board[nr][nc];
        if (dest && isWhite(dest) !== white) {
          moves.push({ r: nr, c: nc, capture: true });
        }
      }
    });
  } else if (type === 'n') {
    const jumps = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    jumps.forEach(([dr, dc]) => addIfValid(row + dr, col + dc));
  } else if (type === 'b' || type === 'r' || type === 'q') {
    const dirs = [];
    if (type === 'b' || type === 'q') {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (type === 'r' || type === 'q') {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }
    dirs.forEach(([dr, dc]) => {
      let step = 1;
      while (true) {
        const nr = row + dr * step;
        const nc = col + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
        const dest = board[nr][nc];
        if (!dest) {
          moves.push({ r: nr, c: nc, capture: false });
        } else {
          if (isWhite(dest) !== white) {
            moves.push({ r: nr, c: nc, capture: true });
          }
          break;
        }
        step++;
      }
    });
  } else if (type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) {
          addIfValid(row + dr, col + dc);
        }
      }
    }
  }

  return moves;
}

/* ========================================================================= */
/* MAIN GAMES WIDGET COMPONENT                                               */
/* ========================================================================= */
export default function GamesWidget() {
  const [activeGame, setActiveGame] = useState(null); // null (Hub) | 'tetris' | 'chess' | 'snake' | 'tictactoe'

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {!activeGame ? (
        <GamesHub onSelectGame={setActiveGame} />
      ) : activeGame === 'tetris' ? (
        <TetrisGame onBack={() => setActiveGame(null)} />
      ) : activeGame === 'chess' ? (
        <ChessGame onBack={() => setActiveGame(null)} />
      ) : activeGame === 'snake' ? (
        <SnakeGame onBack={() => setActiveGame(null)} />
      ) : (
        <TicTacToeGame onBack={() => setActiveGame(null)} />
      )}
    </div>
  );
}

/* ========================================================================= */
/* 2D iOS-LIKE SQUIRCLE APP ICONS                                            */
/* ========================================================================= */
function TetrisAppIcon() {
  return (
    <div className="games-ios-icon tetris" title="Cyber Tetris">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        {/* T-tetromino and I-block */}
        <rect x="5" y="10" width="6" height="6" rx="1.5" fill="#ffffff" fillOpacity="0.95" />
        <rect x="12" y="10" width="6" height="6" rx="1.5" fill="#38bdf8" />
        <rect x="19" y="10" width="6" height="6" rx="1.5" fill="#ffffff" fillOpacity="0.9" />
        <rect x="12" y="17" width="6" height="6" rx="1.5" fill="#a78bfa" />
      </svg>
    </div>
  );
}

function ChessAppIcon() {
  return (
    <div className="games-ios-icon chess" title="Quantum Chess">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        {/* Crisp 2D Knight / Crown piece */}
        <path
          d="M7 23h16v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2zm2-2c0-3 1.8-5 2.8-7-.4-1-.8-2.6-.8-3.6a3.6 3.6 0 0 1 6.5-2.2c1.4.5 1.8 1.4 2.3 2.8 1.4 0 2.8 1.4 2.8 2.8 0 1.8-1.8 3.2-2.8 4.2l.5 3H9z"
          fill="#ffffff"
          fillOpacity="0.96"
        />
        <circle cx="13" cy="11" r="1.2" fill="#4f46e5" />
      </svg>
    </div>
  );
}

function SnakeAppIcon() {
  return (
    <div className="games-ios-icon snake" title="Neon Serpent">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        {/* Serpentine Ribbon with glowing head and orb */}
        <path
          d="M8 21c0-2.2 1.8-4 4-4h6c2.2 0 4-1.8 4-4s-1.8-4-4-4h-2"
          stroke="#ffffff"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="21" r="2.8" fill="#ffffff" />
        <circle cx="21" cy="21" r="2.4" fill="#fef08a" />
      </svg>
    </div>
  );
}

function TicTacToeAppIcon() {
  return (
    <div className="games-ios-icon tictactoe" title="Matrix 3x3 Duel">
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
        {/* 3x3 Grid */}
        <line x1="11" y1="6" x2="11" y2="24" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="19" y1="6" x2="19" y2="24" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="6" y1="11" x2="24" y2="11" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="6" y1="19" x2="24" y2="19" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
        {/* Top X */}
        <path d="M7 7l3 3m0-3l-3 3" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        {/* Bottom O */}
        <circle cx="20.5" cy="20.5" r="2.2" stroke="#ffffff" strokeWidth="2.2" />
        {/* Center X in Gold */}
        <path d="M13.5 13.5l3 3m0-3l-3 3" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ========================================================================= */
/* 1. INTERACTIVE GAMES HUB (2D iOS-LIKE APP TILES)                           */
/* ========================================================================= */
function GamesHub({ onSelectGame }) {
  const games = [
    {
      id: 'tetris',
      title: 'Cyber Tetris',
      tag: 'Arcade Classic',
      meta: 'Single Player • High Score',
      description: 'Stack vibrant falling tetromino blocks, clear rows and set records.',
      iconComponent: TetrisAppIcon
    },
    {
      id: 'chess',
      title: 'Quantum Chess',
      tag: 'Grandmaster Tactics',
      meta: 'Tactical Pass & Play',
      description: 'Interactive board duel with valid move highlights, captures & strategy.',
      iconComponent: ChessAppIcon
    },
    {
      id: 'snake',
      title: 'Neon Serpent',
      tag: 'Reflex Speed',
      meta: 'Fast Reflex • High Score',
      description: 'Maneuver the light ribbon, devour energy orbs and avoid border collisions.',
      iconComponent: SnakeAppIcon
    },
    {
      id: 'tictactoe',
      title: 'Matrix 3x3 Duel',
      tag: 'Quick AI Match',
      meta: 'vs Smart AI or Local',
      description: 'Classic rapid-fire grid duel with instant turn feedback and rematch mode.',
      iconComponent: TicTacToeAppIcon
    }
  ];

  return (
    <div className="games-container">
      <div className="games-card">
        {/* Header Banner */}
        <div className="games-header">
          <div className="games-header-left">
            <div className="games-icon-badge">
              <Gamepad2 size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="games-header-title">Arcade Station</h2>
              <p className="games-header-sub">
                Interactive 2D Mini-Games for Focus Breaks
              </p>
            </div>
          </div>
          <div className="games-live-badge">
            <span className="games-pulse-dot" />
            <span>4 APPS READY</span>
          </div>
        </div>

        {/* 2x2 Interactive iOS-like App Tiles Grid */}
        <div className="games-tiles-grid">
          {games.map((g) => {
            const Icon = g.iconComponent;
            return (
              <div
                key={g.id}
                onClick={() => onSelectGame(g.id)}
                className="games-tile-card"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectGame(g.id);
                  }
                }}
              >
                {/* Top: 2D iOS Squircle App Icon & Category Tag */}
                <div className="games-tile-header">
                  <Icon />
                  <span className="games-tile-tag">{g.tag}</span>
                </div>

                {/* Middle: Game Title & Clean Description */}
                <div className="games-tile-body">
                  <h3 className="games-tile-title">{g.title}</h3>
                  <p className="games-tile-desc">{g.description}</p>
                </div>

                {/* Bottom: Players Meta & Play Button Action */}
                <div className="games-tile-footer">
                  <span className="games-tile-meta">{g.meta}</span>
                  <button type="button" className="games-tile-play-btn">
                    <span>Play Game</span>
                    <Play size={10} fill="currentColor" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 2. PLAYABLE TETRIS GAME                                                   */
/* ========================================================================= */
function TetrisGame({ onBack }) {
  const [grid, setGrid] = useState(createEmptyGrid);
  const [currentPiece, setCurrentPiece] = useState(getRandomTetromino);
  const [nextPiece, setNextPiece] = useState(getRandomTetromino);
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const moveLeft = useCallback(() => {
    if (gameOver || isPaused) return;
    const newPos = { ...pos, x: pos.x - 1 };
    if (!checkCollision(grid, currentPiece, newPos)) {
      setPos(newPos);
    }
  }, [gameOver, isPaused, grid, currentPiece, pos]);

  const moveRight = useCallback(() => {
    if (gameOver || isPaused) return;
    const newPos = { ...pos, x: pos.x + 1 };
    if (!checkCollision(grid, currentPiece, newPos)) {
      setPos(newPos);
    }
  }, [gameOver, isPaused, grid, currentPiece, pos]);

  const rotate = useCallback(() => {
    if (gameOver || isPaused) return;
    const rotatedShape = rotateMatrix(currentPiece.shape);
    const rotatedPiece = { ...currentPiece, shape: rotatedShape };
    if (!checkCollision(grid, rotatedPiece, pos)) {
      setCurrentPiece(rotatedPiece);
    } else {
      // Wall kick attempt
      const kickLeft = { ...pos, x: pos.x - 1 };
      const kickRight = { ...pos, x: pos.x + 1 };
      if (!checkCollision(grid, rotatedPiece, kickLeft)) {
        setPos(kickLeft);
        setCurrentPiece(rotatedPiece);
      } else if (!checkCollision(grid, rotatedPiece, kickRight)) {
        setPos(kickRight);
        setCurrentPiece(rotatedPiece);
      }
    }
  }, [gameOver, isPaused, grid, currentPiece, pos]);

  const moveDown = useCallback(() => {
    if (gameOver || isPaused) return;
    const newPos = { ...pos, y: pos.y + 1 };
    if (!checkCollision(grid, currentPiece, newPos)) {
      setPos(newPos);
    } else {
      // Lock piece into grid
      const newGrid = grid.map(r => [...r]);
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const gy = pos.y + r;
            const gx = pos.x + c;
            if (gy >= 0 && gy < TETRIS_ROWS && gx >= 0 && gx < TETRIS_COLS) {
              newGrid[gy][gx] = currentPiece.color;
            }
          }
        }
      }

      // Check line clears
      let cleared = 0;
      const filteredGrid = newGrid.filter(row => {
        const full = row.every(cell => cell !== null);
        if (full) cleared++;
        return !full;
      });

      while (filteredGrid.length < TETRIS_ROWS) {
        filteredGrid.unshift(Array(TETRIS_COLS).fill(null));
      }

      if (cleared > 0) {
        const lineScores = [0, 100, 300, 500, 800];
        setScore(s => s + (lineScores[cleared] || cleared * 200) * level);
        setLines(l => {
          const newLines = l + cleared;
          setLevel(Math.floor(newLines / 10) + 1);
          return newLines;
        });
      }

      // Spawn next piece
      const spawnPos = { x: 3, y: 0 };
      if (checkCollision(filteredGrid, nextPiece, spawnPos)) {
        setGameOver(true);
      } else {
        setGrid(filteredGrid);
        setCurrentPiece(nextPiece);
        setNextPiece(getRandomTetromino());
        setPos(spawnPos);
      }
    }
  }, [gameOver, isPaused, grid, currentPiece, nextPiece, pos, level]);

  const hardDrop = () => {
    if (gameOver || isPaused) return;
    let currentY = pos.y;
    while (!checkCollision(grid, currentPiece, { x: pos.x, y: currentY + 1 })) {
      currentY++;
    }
    setPos({ x: pos.x, y: currentY });
    setTimeout(moveDown, 20);
  };

  // Game loop interval
  useEffect(() => {
    if (gameOver || isPaused) return;
    const speed = Math.max(120, 800 - (level - 1) * 80);
    const interval = setInterval(moveDown, speed);
    return () => clearInterval(interval);
  }, [moveDown, gameOver, isPaused, level]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') moveLeft();
      else if (e.key === 'ArrowRight') moveRight();
      else if (e.key === 'ArrowDown') moveDown();
      else if (e.key === 'ArrowUp') rotate();
      else if (e.key === ' ') hardDrop();
      else if (e.key === 'p' || e.key === 'P') setIsPaused(p => !p);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate]);

  const resetGame = () => {
    setGrid(createEmptyGrid());
    setCurrentPiece(getRandomTetromino());
    setNextPiece(getRandomTetromino());
    setPos({ x: 3, y: 0 });
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  };

  // Render composite display grid
  const displayGrid = grid.map(r => [...r]);
  if (!gameOver) {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          const gy = pos.y + r;
          const gx = pos.x + c;
          if (gy >= 0 && gy < TETRIS_ROWS && gx >= 0 && gx < TETRIS_COLS) {
            displayGrid[gy][gx] = currentPiece.color;
          }
        }
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col p-2.5 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 transition"
        >
          <ChevronLeft size={14} />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(p => !p)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white text-slate-400 transition"
            title="Pause Game (P)"
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white text-slate-400 transition"
            title="Restart Game"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 flex items-center justify-center gap-4">
        {/* Tetris Board */}
        <div className="relative p-1.5 rounded-xl bg-black/60 border border-white/15 shadow-2xl">
          <div
            className="grid gap-[1px] bg-slate-950/80 p-0.5 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${TETRIS_COLS}, minmax(0, 1fr))`,
              width: '160px',
              height: '320px'
            }}
          >
            {displayGrid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className="w-full h-full rounded-[2px] transition-colors"
                  style={{
                    backgroundColor: cell || 'rgba(255, 255, 255, 0.02)',
                    boxShadow: cell ? `inset 0 0 4px rgba(255, 255, 255, 0.35), 0 0 6px ${cell}40` : 'none',
                    border: cell ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.02)'
                  }}
                />
              ))
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-3 text-center">
              <span className="text-rose-400 font-bold font-mono text-sm tracking-wider uppercase mb-1">
                Game Over
              </span>
              <span className="text-xs text-white font-mono mb-3">
                Final Score: <strong className="text-cyan-400">{score}</strong>
              </span>
              <button
                onClick={resetGame}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                <RotateCcw size={12} />
                <span>Play Again</span>
              </button>
            </div>
          )}

          {/* Paused Overlay */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center text-center">
              <span className="text-cyan-400 font-bold font-mono text-sm tracking-widest uppercase">
                Paused
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Press P or click Play</span>
            </div>
          )}
        </div>

        {/* Sidebar Info & Controls */}
        <div className="flex flex-col justify-between h-[320px] w-40">
          {/* Stats Box */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Score</div>
              <div className="text-lg font-bold font-mono text-cyan-400">{score}</div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Lines</div>
                <div className="text-sm font-bold font-mono text-white">{lines}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
                <div className="text-[9px] font-mono text-slate-400 uppercase">Level</div>
                <div className="text-sm font-bold font-mono text-purple-400">{level}</div>
              </div>
            </div>

            {/* Next Piece Preview */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10 flex flex-col items-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 self-start">
                Next Piece
              </div>
              <div className="grid grid-cols-4 gap-0.5 p-1 bg-black/40 rounded-lg">
                {nextPiece.shape.map((row, r) =>
                  row.map((cell, c) => (
                    <div
                      key={`next-${r}-${c}`}
                      className="w-3 h-3 rounded-[2px]"
                      style={{
                        backgroundColor: cell ? nextPiece.color : 'transparent',
                        boxShadow: cell ? `0 0 6px ${nextPiece.glow}` : 'none'
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* On-Screen Touch / Click Buttons */}
          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
            <div className="text-[9px] font-mono text-slate-400 text-center uppercase mb-1">
              Controls
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={moveLeft}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center text-slate-300 transition"
                title="Left (←)"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={rotate}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center text-slate-300 transition"
                title="Rotate (↑)"
              >
                <RotateCw size={14} />
              </button>
              <button
                onClick={moveRight}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center text-slate-300 transition"
                title="Right (→)"
              >
                <ArrowRight size={14} />
              </button>
              <button
                onClick={moveDown}
                className="col-span-2 p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 flex items-center justify-center text-xs font-mono text-slate-300 transition"
                title="Drop (↓)"
              >
                <ArrowDown size={14} className="mr-1" /> Drop
              </button>
              <button
                onClick={hardDrop}
                className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold text-xs font-mono transition flex items-center justify-center"
                title="Hard Drop (Space)"
              >
                ⚡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 3. PLAYABLE CHESS GAME                                                    */
/* ========================================================================= */
function ChessGame({ onBack }) {
  const [board, setBoard] = useState(INITIAL_CHESS_BOARD);
  const [selectedSquare, setSelectedSquare] = useState(null); // { r, c }
  const [validMoves, setValidMoves] = useState([]);
  const [turn, setTurn] = useState('white'); // 'white' | 'black'
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);

  const handleSquareClick = (r, c) => {
    const clickedPiece = board[r][c];
    const isCurrentPlayerPiece = clickedPiece && (
      (turn === 'white' && isWhite(clickedPiece)) ||
      (turn === 'black' && !isWhite(clickedPiece))
    );

    // If a piece is already selected and we clicked a valid target square
    if (selectedSquare) {
      const isTargetMove = validMoves.some(m => m.r === r && m.c === c);
      if (isTargetMove) {
        // Execute move
        const newBoard = board.map(row => [...row]);
        const piece = newBoard[selectedSquare.r][selectedSquare.c];
        const destPiece = newBoard[r][c];

        if (destPiece) {
          if (isWhite(destPiece)) {
            setCapturedWhite(prev => [...prev, destPiece]);
          } else {
            setCapturedBlack(prev => [...prev, destPiece]);
          }
        }

        newBoard[r][c] = piece;
        newBoard[selectedSquare.r][selectedSquare.c] = null;
        setBoard(newBoard);

        const notation = `${piece} ${String.fromCharCode(97 + selectedSquare.c)}${8 - selectedSquare.r} → ${String.fromCharCode(97 + c)}${8 - r}`;
        setMoveHistory(prev => [notation, ...prev.slice(0, 5)]);

        // Clear selection & switch turn
        setSelectedSquare(null);
        setValidMoves([]);
        setTurn(prev => (prev === 'white' ? 'black' : 'white'));
        return;
      }
    }

    // Select new piece if it belongs to current turn player
    if (isCurrentPlayerPiece) {
      setSelectedSquare({ r, c });
      const moves = getChessMoves(board, r, c);
      setValidMoves(moves);
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const resetChess = () => {
    setBoard(INITIAL_CHESS_BOARD);
    setSelectedSquare(null);
    setValidMoves([]);
    setTurn('white');
    setCapturedWhite([]);
    setCapturedBlack([]);
    setMoveHistory([]);
  };

  return (
    <div className="flex-1 flex flex-col p-2.5 overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 transition"
        >
          <ChevronLeft size={14} />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${
                turn === 'white' ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : 'bg-purple-400 shadow-[0_0_8px_#c084fc]'
              }`}
            />
            <span className="text-white font-bold uppercase">
              {turn === 'white' ? 'White to Move' : 'Black to Move'}
            </span>
          </div>

          <button
            onClick={resetChess}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white text-slate-400 transition"
            title="Reset Board"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Board View */}
      <div className="flex-1 flex items-center justify-center gap-5">
        {/* 8x8 Chessboard */}
        <div className="p-2 rounded-2xl bg-black/60 border border-white/15 shadow-2xl">
          <div className="grid grid-cols-8 grid-rows-8 w-72 h-72 border border-white/10 rounded-xl overflow-hidden">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isSelected = selectedSquare && selectedSquare.r === r && selectedSquare.c === c;
                const isTarget = validMoves.some(m => m.r === r && m.c === c);
                const isDarkSquare = (r + c) % 2 === 1;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative w-full h-full flex items-center justify-center transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-cyan-500/40 ring-2 ring-cyan-400 ring-inset'
                        : isDarkSquare
                        ? 'bg-slate-900/90'
                        : 'bg-slate-800/50'
                    }`}
                  >
                    {/* Destination Target Marker */}
                    {isTarget && (
                      <span
                        className={`absolute w-3 h-3 rounded-full pointer-events-none ${
                          cell ? 'ring-2 ring-rose-400 bg-rose-500/40' : 'bg-cyan-400/80 shadow-[0_0_6px_#06b6d4]'
                        }`}
                      />
                    )}

                    {/* Chess Piece Symbol */}
                    {cell && (
                      <span
                        className={`text-2xl font-normal leading-none transform transition-transform hover:scale-110 ${
                          isWhite(cell)
                            ? 'text-cyan-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                            : 'text-purple-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
                        }`}
                      >
                        {CHESS_SYMBOLS[cell]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Tactical Tray & History */}
        <div className="flex flex-col justify-between h-72 w-40">
          {/* Captured White Pieces */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10">
            <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">
              Captured (White)
            </span>
            <div className="flex flex-wrap gap-1 min-h-[22px] text-sm text-cyan-200">
              {capturedWhite.length === 0 ? (
                <span className="text-[10px] text-slate-500">None</span>
              ) : (
                capturedWhite.map((p, i) => <span key={i}>{CHESS_SYMBOLS[p]}</span>)
              )}
            </div>
          </div>

          {/* Captured Black Pieces */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10">
            <span className="text-[10px] font-mono text-purple-400 uppercase block mb-1">
              Captured (Black)
            </span>
            <div className="flex flex-wrap gap-1 min-h-[22px] text-sm text-purple-400">
              {capturedBlack.length === 0 ? (
                <span className="text-[10px] text-slate-500">None</span>
              ) : (
                capturedBlack.map((p, i) => <span key={i}>{CHESS_SYMBOLS[p]}</span>)
              )}
            </div>
          </div>

          {/* Move Log */}
          <div className="flex-1 p-2.5 rounded-xl bg-slate-900/60 border border-white/10 mt-2 flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase mb-1">
              Move History
            </span>
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-300 scrollbar-thin">
              {moveHistory.length === 0 ? (
                <span className="text-slate-500">Tap piece to begin</span>
              ) : (
                moveHistory.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="text-cyan-400">▸</span>
                    <span>{m}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 4. PLAYABLE NEON SNAKE GAME                                               */
/* ========================================================================= */
function SnakeGame({ onBack }) {
  const GRID_SIZE = 14;
  const [snake, setSnake] = useState([
    { x: 5, y: 7 },
    { x: 4, y: 7 },
    { x: 3, y: 7 }
  ]);
  const [food, setFood] = useState({ x: 9, y: 7 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const resetSnake = () => {
    setSnake([
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 }
    ]);
    setFood({ x: 9, y: 7 });
    setDir({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setSnake(prev => {
        const head = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };

        // Wall collisions
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some(seg => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood({
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [dir, food, gameOver]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowUp' && dir.y === 0) setDir({ x: 0, y: -1 });
      else if (e.key === 'ArrowDown' && dir.y === 0) setDir({ x: 0, y: 1 });
      else if (e.key === 'ArrowLeft' && dir.x === 0) setDir({ x: -1, y: 0 });
      else if (e.key === 'ArrowRight' && dir.x === 0) setDir({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dir]);

  return (
    <div className="flex-1 flex flex-col p-2.5 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-white/5 border border-white/10 transition"
        >
          <ChevronLeft size={14} />
          <span>Arcade Hub</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-300">
            Score: <strong className="text-emerald-400">{score}</strong>
          </span>
          <button
            onClick={resetSnake}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white text-slate-400 transition"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative p-2 rounded-2xl bg-black/60 border border-white/15">
          <div
            className="grid gap-[2px] bg-slate-950 p-1 rounded-xl"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              width: '260px',
              height: '260px'
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = snake.some(s => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div
                  key={i}
                  className="rounded-[2px] transition-all"
                  style={{
                    backgroundColor: isHead
                      ? '#34d399'
                      : isBody
                      ? '#059669'
                      : isFood
                      ? '#f43f5e'
                      : 'rgba(255, 255, 255, 0.03)',
                    boxShadow: isHead
                      ? '0 0 10px #34d399'
                      : isFood
                      ? '0 0 10px #f43f5e'
                      : 'none'
                  }}
                />
              );
            })}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-3 text-center">
              <span className="text-rose-400 font-bold font-mono text-sm uppercase mb-1">
                Collision Detected
              </span>
              <span className="text-xs text-white font-mono mb-3">
                Score: <strong className="text-emerald-400">{score}</strong>
              </span>
              <button
                onClick={resetSnake}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <RotateCcw size={12} />
                <span>Try Again</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 5. PLAYABLE MATRIX 3X3 DUEL (TIC-TAC-TOE)                                 */
/* ========================================================================= */
function TicTacToeGame({ onBack }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : 'Draw';
  };

  const winner = calculateWinner(board);

  const handleClick = (i) => {
    if (board[i] || winner) return;
    const nextBoard = [...board];
    nextBoard[i] = isXNext ? 'X' : 'O';
    setBoard(nextBoard);
    setIsXNext(!isXNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  return (
    <div className="flex-1 flex flex-col p-2.5 overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-white/5 border border-white/10 transition"
        >
          <ChevronLeft size={14} />
          <span>Arcade Hub</span>
        </button>

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:text-white text-slate-400 transition"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="grid grid-cols-3 gap-2.5 w-60 h-60 mb-3">
          {board.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleClick(idx)}
              className="w-full h-full rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-400/50 text-2xl font-bold font-mono transition flex items-center justify-center shadow-lg hover:scale-105"
            >
              <span className={cell === 'X' ? 'text-cyan-400 drop-shadow-[0_0_8px_#06b6d4]' : 'text-purple-400 drop-shadow-[0_0_8px_#c084fc]'}>
                {cell}
              </span>
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-300">
          {winner ? (
            <span className="text-cyan-300 font-bold">
              {winner === 'Draw' ? "It's a Stalemate Draw!" : `Victory: ${winner}!`}
            </span>
          ) : (
            <span>Turn: <strong className="text-cyan-400">{isXNext ? 'Player X' : 'Player O'}</strong></span>
          )}
        </div>
      </div>
    </div>
  );
}
