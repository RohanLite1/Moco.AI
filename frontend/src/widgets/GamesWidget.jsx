import React, { useState } from 'react';
import { RotateCcw, Gamepad2, Trophy } from 'lucide-react';

export default function GamesWidget() {
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
    <div className="flex flex-col items-center justify-center h-full bg-slate-900/60 rounded-2xl border border-white/10 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between w-full max-w-[220px] mb-3">
        <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-300">
          <Gamepad2 size={16} className="text-cyan-400" />
          <span>Mini Break Game</span>
        </div>
        <button
          onClick={resetGame}
          className="text-slate-400 hover:text-white p-1 transition"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 w-48 h-48 mb-3">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            className="w-full h-full rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-xl font-bold font-mono transition flex items-center justify-center cursor-pointer"
          >
            <span className={cell === 'X' ? 'text-cyan-400' : 'text-purple-400'}>
              {cell}
            </span>
          </button>
        ))}
      </div>

      <div className="text-xs font-mono text-slate-300">
        {winner ? (
          <span className="text-cyan-300 font-bold">
            {winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}!`}
          </span>
        ) : (
          <span>Next Turn: <strong className="text-cyan-400">{isXNext ? 'X' : 'O'}</strong></span>
        )}
      </div>
    </div>
  );
}
