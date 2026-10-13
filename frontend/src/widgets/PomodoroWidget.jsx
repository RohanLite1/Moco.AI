import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Flame,
  Timer as TimerIcon
} from 'lucide-react';
import { api } from '../services/api';

export default function PomodoroWidget() {
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  // Timer Tick Engine
  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
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
        'Focus Session Complete! 🎉',
        isLongBreak
          ? 'Great milestone! Take a 15-minute long recharge break.'
          : 'Nicely done! Enjoy a 5-minute break.'
      );
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

  const handleSkip = () => {
    handleComplete();
  };

  const setPreset = (mins, modeType) => {
    setIsRunning(false);
    setMode(modeType);
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
  };

  // Format MM:SS with fixed tabular numerals
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular timer geometry (Exact 220px x 220px)
  const circleSize = 220;
  const strokeWidth = 9;
  const radius = (circleSize - strokeWidth) / 2; // 105.5
  const circumference = 2 * Math.PI * radius; // ~662.87
  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const presets = [
    { label: '25m Focus', mins: 25, modeType: 'focus' },
    { label: '50m Deep', mins: 50, modeType: 'focus' },
    { label: '5m Break', mins: 5, modeType: 'break' },
    { label: '15m Rest', mins: 15, modeType: 'break' }
  ];

  return (
    <div className="w-full flex items-center justify-center py-2 px-1 select-none">
      {/* =================================================================== */}
      {/* 1. OVERALL CONTAINER (COMPACT PREMIUM DASHBOARD CARD)               */}
      {/* =================================================================== */}
      <div
        className="w-full max-w-[440px] rounded-[20px] bg-[#FFFFFF] border border-[#E8ECF4] flex flex-col gap-5 p-6 transition-all duration-300"
        style={{
          boxSizing: 'border-box',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* ----------------------------------------------------------------- */}
        {/* 2. HEADER: TIMER ICON, HEADING, SUBTITLE                          */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ECFEFF] border border-[#CFFAFE] flex items-center justify-center text-[#0891B2] shrink-0">
            <TimerIcon size={20} strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[22px] sm:text-[24px] font-semibold text-[#111827] tracking-tight leading-tight">
              Focus Session
            </h2>
            <p className="text-[14px] text-[#64748B] font-normal leading-normal mt-0.5">
              {isRunning ? 'Session Active' : 'Ready to Focus'}
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 3. MODE SELECTOR (SEGMENTED CONTROL COMPONENT)                    */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#F1F5F9] border border-[#E8ECF4]">
          {presets.map((preset) => {
            const isActive =
              mode === preset.modeType && duration === preset.mins * 60;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPreset(preset.mins, preset.modeType)}
                className={`py-1.5 px-1 rounded-lg text-[12px] sm:text-[13px] font-medium tracking-tight transition-all duration-200 text-center truncate cursor-pointer ${
                  isActive
                    ? 'bg-[#ECFEFF] text-[#0E7490] font-semibold border border-[#A5F3FC] shadow-xs'
                    : 'bg-transparent text-[#64748B] hover:text-[#111827] hover:bg-[#E2E8F0]/60 border border-transparent'
                }`}
                style={{
                  outline: 'none',
                  WebkitAppearance: 'none'
                }}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 4. CIRCULAR COUNTDOWN TIMER (220px x 220px)                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center justify-center my-0.5">
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              maxWidth: '65vw',
              aspectRatio: '1 / 1'
            }}
          >
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox={`0 0 ${circleSize} ${circleSize}`}
            >
              <defs>
                <linearGradient id="pomodoroProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>

              {/* Muted Track Circle */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
                fill="transparent"
              />

              {/* Progress Ring with Cyan-to-Indigo Gradient */}
              <circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                stroke="url(#pomodoroProgressGradient)"
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

            {/* Centered Countdown & Status Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span
                className="text-[44px] sm:text-[46px] font-bold text-[#111827] leading-none tracking-tight"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: '"tnum"'
                }}
              >
                {formattedTime}
              </span>
              <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0E7490] mt-2">
                {mode === 'focus' ? 'FOCUS MODE' : 'BREAK MODE'}
              </span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 5. SHORT SUPPORTING TEXT                                          */}
        {/* ----------------------------------------------------------------- */}
        <p className="text-[13px] text-[#64748B] font-medium text-center -mt-2">
          Stay present. Make progress.
        </p>

        {/* ----------------------------------------------------------------- */}
        {/* 6. PRIMARY TIMER CONTROLS                                         */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex items-center gap-2.5 w-full">
          {/* Primary Button */}
          <button
            type="button"
            onClick={toggleTimer}
            className="flex-1 h-[44px] px-5 rounded-xl bg-[#111827] hover:bg-[#1F2937] active:bg-[#0F172A] text-[#FFFFFF] text-[13px] font-semibold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 cursor-pointer"
            style={{
              border: 'none',
              outline: 'none',
              WebkitAppearance: 'none'
            }}
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
            className="w-[44px] h-[44px] rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-[#E8ECF4] text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] cursor-pointer shrink-0"
            title="Reset Timer"
            style={{
              outline: 'none',
              WebkitAppearance: 'none'
            }}
          >
            <RotateCcw size={16} strokeWidth={2.2} />
          </button>

          {/* Secondary Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="w-[44px] h-[44px] rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] active:bg-[#E2E8F0] border border-[#E8ECF4] text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] cursor-pointer shrink-0"
            title="Skip to Next"
            style={{
              outline: 'none',
              WebkitAppearance: 'none'
            }}
          >
            <FastForward size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 7. DAILY STREAK SECTION                                           */}
        {/* ----------------------------------------------------------------- */}
        <div className="pt-3.5 border-t border-[#F1F5F9] flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFFBEB] border border-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0">
              <Flame size={16} fill={sessions > 0 ? '#F59E0B' : 'none'} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-[#111827]">
                Today's Streak
              </span>
              <span className="text-[11px] text-[#64748B]">
                {sessions === 0
                  ? '0 sessions completed'
                  : `${sessions} sessions completed`}
              </span>
            </div>
          </div>

          <div className="flex items-baseline">
            <span
              className="text-[22px] font-bold text-[#111827]"
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum"'
              }}
            >
              {sessions}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
