import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Flame, Bell, Coffee, Brain } from 'lucide-react';
import { api } from '../services/api';

export default function PomodoroWidget() {
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [duration, setDuration] = useState(25 * 60);
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
    if (mode === 'focus') {
      const nextCount = sessions + 1;
      setSessions(nextCount);
      const isLongBreak = nextCount % 4 === 0;
      setMode('break');
      const nextDuration = isLongBreak ? 15 * 60 : 5 * 60;
      setDuration(nextDuration);
      setTimeLeft(nextDuration);
      api.notify('Focus Sprint Complete! 🎉', isLongBreak ? 'Incredible run! Take a 15-minute long recharge break.' : 'Great job! Enjoy a 5-minute break.');
    } else {
      setMode('focus');
      setDuration(25 * 60);
      setTimeLeft(25 * 60);
      api.notify('Break Complete ⚡', 'Ready for the next productive sprint? Let’s go!');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const setPreset = (mins, modeType) => {
    setIsRunning(false);
    setMode(modeType);
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG Circular progress calculation
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center justify-between h-full bg-slate-900/70 rounded-2xl border border-white/10 p-4 backdrop-blur-2xl shadow-xl text-center">
      {/* Top Presets */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 w-full max-w-[340px]">
        <button
          onClick={() => setPreset(25, 'focus')}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition ${
            mode === 'focus' && duration === 25 * 60
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          25m Focus
        </button>
        <button
          onClick={() => setPreset(50, 'focus')}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition ${
            mode === 'focus' && duration === 50 * 60
              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          50m Deep
        </button>
        <button
          onClick={() => setPreset(5, 'break')}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition ${
            mode === 'break' && duration === 5 * 60
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          5m Break
        </button>
        <button
          onClick={() => setPreset(15, 'break')}
          className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition ${
            mode === 'break' && duration === 15 * 60
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          15m Rest
        </button>
      </div>

      {/* Circular Glowing Timer */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-44 h-44 -rotate-90">
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="currentColor"
            strokeWidth="7"
            className="text-white/5"
            fill="transparent"
          />
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke={mode === 'focus' ? '#06b6d4' : '#a855f7'}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 8px ${mode === 'focus' ? '#06b6d4' : '#a855f7'})`
            }}
          />
        </svg>

        {/* Center Time & Mode */}
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-extrabold font-mono tracking-wider text-white">
            {formattedTime}
          </span>
          <span
            className="text-[10px] font-mono tracking-widest uppercase mt-1 px-2 py-0.5 rounded-full border"
            style={{
              color: mode === 'focus' ? '#06b6d4' : '#c084fc',
              borderColor: mode === 'focus' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(168, 85, 247, 0.3)',
              backgroundColor: mode === 'focus' ? 'rgba(6, 182, 212, 0.1)' : 'rgba(168, 85, 247, 0.1)'
            }}
          >
            {mode === 'focus' ? 'Focus Mode' : 'Resting Break'}
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTimer}
          className={`px-6 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-2 transition cursor-pointer shadow-lg ${
            isRunning
              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25'
          }`}
        >
          {isRunning ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={resetTimer}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
          title="Reset Current Timer"
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={handleComplete}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
          title="Skip to Next Session"
        >
          <FastForward size={15} />
        </button>
      </div>

      {/* Session Counter Streak Pill */}
      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
        <Flame size={13} className="text-amber-400" />
        <span>Today's Streak:</span>
        <span className="text-white font-bold">{sessions} completed</span>
      </div>
    </div>
  );
}
