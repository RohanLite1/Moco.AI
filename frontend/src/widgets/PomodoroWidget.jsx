import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Flame,
  Sparkles,
  Timer as TimerIcon
} from 'lucide-react';
import { api } from '../services/api';

export default function PomodoroWidget() {
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  // Timer Tick
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
      api.notify(
        'Focus Session Complete 🎉',
        isLongBreak
          ? 'Great milestone! Take a 15-minute restorative break.'
          : 'Nicely done! Take a 5-minute breather.'
      );
    } else {
      setMode('focus');
      setDuration(25 * 60);
      setTimeLeft(25 * 60);
      api.notify('Break Concluded ⚡', 'Ready to dive back into your focus zone?');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const setPreset = (mins, modeType) => {
    setIsRunning(false);
    setMode(modeType);
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
  };

  // Format MM:SS with tabular digits
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular progress calculations
  const radius = 74;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // Daily goal calculation (e.g. 4 sessions goal)
  const dailyTarget = 4;
  const goalProgress = Math.min(100, Math.round((sessions / dailyTarget) * 100));

  const presets = [
    { label: '25m Focus', mins: 25, modeType: 'focus' },
    { label: '50m Deep', mins: 50, modeType: 'focus' },
    { label: '5m Break', mins: 5, modeType: 'break' },
    { label: '15m Rest', mins: 15, modeType: 'break' }
  ];

  return (
    <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 select-none">
      {/* =================================================================== */}
      {/* NEO-MINIMALIST FOCUS TILE CONTAINER                                 */}
      {/* =================================================================== */}
      <div
        className="w-full max-w-[420px] rounded-[24px] bg-[#FFFFFF] border border-[#E8ECF4] flex flex-col justify-between p-5 sm:p-6 transition-all duration-300"
        style={{
          boxShadow: '0 16px 36px -6px rgba(17, 24, 39, 0.06), 0 4px 14px -2px rgba(17, 24, 39, 0.02)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* ----------------------------------------------------------------- */}
        {/* 1. TILE HEADER                                                    */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#ECFEFF] border border-[#CFFAFE] flex items-center justify-center text-[#0891B2]">
              <TimerIcon size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-tight text-[#111827] uppercase">
                Focus Session
              </h2>
            </div>
          </div>

          {/* Status Label Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0]">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                isRunning
                  ? 'bg-[#22D3EE] shadow-[0_0_6px_#22D3EE] animate-pulse'
                  : 'bg-[#94A3B8]'
              }`}
            />
            <span className="text-[10px] font-semibold tracking-wider font-mono uppercase text-[#475569]">
              {isRunning ? 'Session Active' : 'Ready to Focus'}
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 2. FOCUS MODE SELECTOR (SEGMENTED PILL CONTROL)                   */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#F8FAFC] border border-[#E8ECF4] my-3.5">
          {presets.map((preset) => {
            const isActive =
              mode === preset.modeType && duration === preset.mins * 60;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPreset(preset.mins, preset.modeType)}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-medium tracking-tight transition-all duration-200 text-center truncate ${
                  isActive
                    ? 'bg-[#ECFEFF] text-[#0E7490] font-semibold border border-[#A5F3FC] shadow-sm'
                    : 'text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] border border-transparent'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 3. MAIN CIRCULAR COUNTDOWN TIMER                                  */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative flex flex-col items-center justify-center my-2 sm:my-3">
          <svg
            className="w-48 h-48 sm:w-52 sm:h-52 -rotate-90 transform"
            viewBox="0 0 180 180"
          >
            {/* Gradient definition for progress stroke */}
            <defs>
              <linearGradient id="focusProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>

            {/* Background Track Circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Animated Progress Circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="url(#focusProgressGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-700 ease-out"
              style={{
                filter: isRunning ? 'drop-shadow(0 2px 8px rgba(34, 211, 238, 0.25))' : 'none'
              }}
            />
          </svg>

          {/* Centered Countdown Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span
              className="text-4xl sm:text-[44px] font-bold tracking-tight text-[#111827] leading-none"
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"'
              }}
            >
              {formattedTime}
            </span>
            <span className="text-[11px] font-medium text-[#64748B] tracking-normal mt-2">
              {isRunning
                ? mode === 'focus'
                  ? 'Stay present. Make progress.'
                  : 'Rest your eyes & recharge.'
                : 'Stay present. Make progress.'}
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 4. TIMER CONTROLS                                                 */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-center gap-3 my-2">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={toggleTimer}
            className="flex-1 max-w-[190px] h-11 px-5 rounded-xl bg-[#111827] hover:bg-[#1F2937] active:bg-[#0F172A] text-[#FFFFFF] text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2"
          >
            {isRunning ? (
              <>
                <Pause size={15} strokeWidth={2.4} />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play size={15} fill="currentColor" strokeWidth={0} />
                <span>Start Focus</span>
              </>
            )}
          </button>

          {/* Secondary Reset Button */}
          <button
            type="button"
            onClick={resetTimer}
            className="w-11 h-11 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-[#E8ECF4] text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-1"
            title="Reset Timer"
          >
            <RotateCcw size={15} strokeWidth={2.2} />
          </button>

          {/* Secondary Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-11 h-11 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-[#E8ECF4] text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-1"
            title="Skip to Next"
          >
            <FastForward size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 5. DAILY STREAK SECTION                                           */}
        {/* ----------------------------------------------------------------- */}
        <div className="pt-3.5 mt-2 border-t border-[#F1F5F9] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Flame
                size={14}
                className={sessions > 0 ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}
                fill={sessions > 0 ? '#F59E0B' : 'none'}
              />
              <span className="font-semibold text-[#111827]">Today's Streak</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span
                className="font-bold text-[#111827] text-sm"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {sessions}
              </span>
              <span className="text-[11px] text-[#64748B]">sessions completed</span>
            </div>
          </div>

          {/* Thin Progress Indicator toward Daily Goal */}
          <div className="w-full h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#22D3EE] to-[#6366F1]"
              style={{ width: `${goalProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-[#94A3B8]">
            <span>
              {sessions === 0
                ? 'Begin your first sprint today.'
                : `${sessions} of ${dailyTarget} target sessions reached`}
            </span>
            <span className="font-medium text-[#64748B]">
              Goal: {dailyTarget}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
