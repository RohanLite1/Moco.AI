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
/* 1. INTERACTIVE GAMES HUB (TILES WITH ANIMATED VISUAL PREVIEWS)             */
/* ========================================================================= */
function GamesHub({ onSelectGame }) {
  const games = [
    {
      id: 'tetris',
      title: 'Cyber Tetris',
      tag: 'Arcade Classic',
      accent: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.35)',
      description: 'Stack vibrant tetrominoes, create combos & beat high scores.',
      type: 'tetris'
    },
    {
      id: 'chess',
      title: 'Quantum Chess',
      tag: 'Grandmaster Tactics',
      accent: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.35)',
      description: 'Interactive tactical duel with valid path highlights & captures.',
      type: 'chess'
    },
    {
      id: 'snake',
      title: 'Neon Serpent',
      tag: 'Reflex Speed',
      accent: '#10b981',
      glow: 'rgba(16, 185, 129, 0.35)',
      description: 'Maneuver the light ribbon, devour energy orbs and avoid collisions.',
      type: 'snake'
    },
    {
      id: 'tictactoe',
      title: 'Matrix 3x3 Duel',
      tag: 'Quick AI Match',
      accent: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.35)',
      description: 'Classic rapid-fire grid duel against AI or a friend.',
      type: 'tictactoe'
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-2 overflow-y-auto scrollbar-thin">
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
            <Gamepad2 size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white uppercase font-mono">
              Arcade Station
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive mini-games for focus breaks
            </p>
          </div>
        </div>
        <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          4 Modules Online
        </div>
      </div>

      {/* 2x2 Interactive Tiles Grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {games.map((g) => (
          <div
            key={g.id}
            onClick={() => onSelectGame(g.id)}
            className="group relative flex flex-col justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer overflow-hidden hover:scale-[1.02] hover:shadow-xl"
            style={{
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4)`
            }}
          >
            {/* Background Ambient Glow */}
            <div
              className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-50 transition-opacity"
              style={{ backgroundColor: g.accent }}
            />

            {/* Top Info */}
            <div className="flex items-start justify-between z-10 mb-2">
              <div>
                <span
                  className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border tracking-wider"
                  style={{
                    color: g.accent,
                    borderColor: `${g.accent}40`,
                    backgroundColor: `${g.accent}15`
                  }}
                >
                  {g.tag}
                </span>
                <h3 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">
                  {g.title}
                </h3>
              </div>
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${g.accent}20`, color: g.accent }}
              >
                <Play size={12} fill="currentColor" />
              </div>
            </div>

            {/* Animated Interactive Visual Preview Tile */}
            <div className="w-full h-20 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden my-1 relative">
              {g.type === 'tetris' && <TetrisPreviewTile />}
              {g.type === 'chess' && <ChessPreviewTile />}
              {g.type === 'snake' && <SnakePreviewTile />}
              {g.type === 'tictactoe' && <TicTacToePreviewTile />}
            </div>

            {/* Bottom Details & CTA */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 z-10">
              <span className="line-clamp-1 text-slate-400">{g.description}</span>
              <span className="text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0 ml-1">
                Play →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================================================= */
/* TILE VISUAL PREVIEWS (LIVELY MINI ANIMATIONS)                              */
/* ========================================================================= */
function TetrisPreviewTile() {
  return (
    <div className="flex items-center gap-1.5 p-2 animate-pulse">
      <div className="grid grid-cols-2 gap-0.5">
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        <div className="w-3.5 h-3.5 rounded-sm bg-transparent" />
        <div className="w-3.5 h-3.5 rounded-sm bg-purple-400 shadow-[0_0_8px_#c084fc]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-transparent" />
        <div className="w-3.5 h-3.5 rounded-sm bg-purple-400 shadow-[0_0_8px_#c084fc]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-purple-400 shadow-[0_0_8px_#c084fc]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-purple-400 shadow-[0_0_8px_#c084fc]" />
      </div>
      <div className="grid grid-cols-2 gap-0.5">
        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      </div>
    </div>
  );
}

function ChessPreviewTile() {
  return (
    <div className="grid grid-cols-4 gap-1 p-2">
      <div className="w-4 h-4 rounded bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs text-purple-300">
        ♞
      </div>
      <div className="w-4 h-4 rounded bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-xs text-cyan-200">
        •
      </div>
      <div className="w-4 h-4 rounded bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs text-purple-300">
        ♛
      </div>
      <div className="w-4 h-4 rounded bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-xs text-cyan-200">
        •
      </div>
      <div className="w-4 h-4 rounded bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-xs text-cyan-200">
        •
      </div>
      <div className="w-4 h-4 rounded bg-cyan-600/30 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-300 font-bold shadow-[0_0_8px_#06b6d4]">
        ♘
      </div>
      <div className="w-4 h-4 rounded bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-xs text-cyan-200">
        •
      </div>
      <div className="w-4 h-4 rounded bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs text-purple-300">
        ♟
      </div>
    </div>
  );
}

function SnakePreviewTile() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
        <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
      </div>
      <div className="w-6 border-t border-dashed border-emerald-500/40 mx-1" />
      <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_#f43f5e]" />
    </div>
  );
}

function TicTacToePreviewTile() {
  return (
    <div className="grid grid-cols-3 gap-1 p-2 font-mono font-bold text-xs">
      <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-cyan-400">X</div>
      <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-purple-400">O</div>
      <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-cyan-400">X</div>
      <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-purple-400">O</div>
      <div className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">X</div>
      <div className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-slate-500">•</div>
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
