import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { api } from '../services/api';

export default function PomodoroWidget() {
  const [mode, setMode] = useState('work'); // 'work' | 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleComplete = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setSessions(s => s + 1);
      setMode('break');
      setTimeLeft(5 * 60);
      api.notify('Pomodoro Done!', 'Great work! Take a 5-minute break.');
    } else {
      setMode('work');
      setTimeLeft(25 * 60);
      api.notify('Break Ended', 'Time to get back in the zone!');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900/60 rounded-2xl border border-white/10 p-6 backdrop-blur-xl text-center">
      {/* Mode Selector */}
      <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 mb-6">
        <button
          onClick={() => switchMode('work')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            mode === 'work' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Focus (25m)
        </button>
        <button
          onClick={() => switchMode('break')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
            mode === 'break' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Break (5m)
        </button>
      </div>

      {/* Countdown Ring */}
      <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-4 border-cyan-500/20 mb-6">
        <div className="text-4xl font-bold font-mono tracking-wider text-white">
          {formattedTime}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTimer}
          className="p-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition shadow-lg shadow-cyan-500/30 flex items-center gap-2"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>
        <button
          onClick={resetTimer}
          className="p-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="mt-4 text-xs text-slate-400 font-mono">
        Completed today: <span className="text-cyan-400 font-bold">{sessions}</span>
      </div>
    </div>
  );
}
