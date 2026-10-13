import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Flame,
  Timer as TimerIcon,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import '../styles/pomodoro.css';

export default function PomodoroWidget() {
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  // Live real-time system clock for header digital display
  const [currentTime, setCurrentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const clockTimer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

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
        'Focus Session Complete!',
        isLongBreak
          ? 'Great milestone! Take a 15-minute long recharge break.'
          : 'Nicely done! Enjoy a 5-minute break.'
      );
    } else {
      setMode('focus');
      setDuration(25 * 60);
      setTimeLeft(25 * 60);
      api.notify('Break Complete!', 'Ready for the next productive sprint? Let’s go!');
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

  // Circular timer geometry (220px x 220px)
  const circleSize = 220;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2; // 106
  const circumference = 2 * Math.PI * radius; // ~666
  const progress = duration > 0 ? (duration - timeLeft) / duration : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const presets = [
    { label: '25m Focus', mins: 25, modeType: 'focus' },
    { label: '50m Deep', mins: 50, modeType: 'focus' },
    { label: '5m Break', mins: 5, modeType: 'break' },
    { label: '15m Rest', mins: 15, modeType: 'break' }
  ];

  return (
    <div className="pomo-container">
      {/* =================================================================== */}
      {/* 1. OVERALL CONTAINER (PREMIUM DASHBOARD CARD)                       */}
      {/* =================================================================== */}
      <div className="pomo-card">
        {/* ----------------------------------------------------------------- */}
        {/* 2. HEADER: ICON, TITLE, SUBTITLE & REAL-TIME DIGITAL CLOCK        */}
        {/* ----------------------------------------------------------------- */}
        <div className="pomo-header">
          <div className="pomo-header-left">
            <div className="pomo-icon-badge">
              <TimerIcon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="pomo-header-title">Focus Session</h2>
              <p className="pomo-header-subtitle">
                {isRunning ? 'Session Active' : 'Ready to Focus'}
              </p>
            </div>
          </div>

          {/* Live System Digital Clock Badge */}
          <div className="pomo-live-clock-badge" title="Current Local Time">
            <Clock size={12} strokeWidth={2} />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 3. MODE SELECTOR (SEGMENTED CONTROL COMPONENT)                    */}
        {/* ----------------------------------------------------------------- */}
        <div className="pomo-mode-selector">
          {presets.map((preset) => {
            const isActive =
              mode === preset.modeType && duration === preset.mins * 60;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPreset(preset.mins, preset.modeType)}
                className={`pomo-mode-btn ${isActive ? 'active' : ''}`}
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
        {/* 4. CIRCULAR COUNTDOWN TIMER WITH DIGITAL CLOCK INSIDE             */}
        {/* ----------------------------------------------------------------- */}
        <div
          className="pomo-circle-container"
          style={{
            position: 'relative',
            width: `${circleSize}px`,
            height: `${circleSize}px`,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          {/* Circular SVG Ring */}
          <svg
            className="pomo-circle-svg"
            viewBox={`0 0 ${circleSize} ${circleSize}`}
            style={{
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              transform: 'rotate(-90deg)',
              display: 'block'
            }}
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
              className="pomo-track-circle"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Dynamic Progress Ring */}
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
              className="pomo-progress-circle"
              style={{
                transition: 'stroke-dashoffset 0.6s ease',
                filter: isRunning ? 'drop-shadow(0 2px 8px rgba(34, 211, 238, 0.35))' : 'none'
              }}
            />
          </svg>

          {/* =============================================================== */}
          {/* DIGITAL CLOCK (CENTERED INSIDE CIRCLE)                          */}
          {/* =============================================================== */}
          <div
            className="pomo-digital-clock"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              pointerEvents: 'none',
              boxSizing: 'border-box'
            }}
          >
            {/* Status indicator tag */}
            <div
              className="pomo-clock-status-tag"
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {isRunning ? (
                <>
                  <span className="pomo-clock-pulse-dot" />
                  <span>FOCUSING</span>
                </>
              ) : (
                <span>READY</span>
              )}
            </div>

            {/* Prominent Digital Clock Digits */}
            <div
              className="pomo-digital-digits"
              style={{
                fontSize: '46px',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '-1.5px',
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {formattedTime}
            </div>

            {/* Digital Clock Mode Pill */}
            <div
              className="pomo-mode-pill"
              style={{
                marginTop: '8px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase'
              }}
            >
              {mode === 'focus' ? 'FOCUS SESSION' : 'BREAK SESSION'}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 5. SHORT SUPPORTING TEXT                                          */}
        {/* ----------------------------------------------------------------- */}
        <p className="pomo-subtext">
          Stay present. Make progress.
        </p>

        {/* ----------------------------------------------------------------- */}
        {/* 6. PRIMARY TIMER CONTROLS                                         */}
        {/* ----------------------------------------------------------------- */}
        <div className="pomo-controls-row">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={toggleTimer}
            className="pomo-btn-main"
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
            className="pomo-btn-action"
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
            className="pomo-btn-action"
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
        <div className="pomo-streak-footer">
          <div className="pomo-streak-left">
            <div className="pomo-streak-badge">
              <Flame size={16} fill={sessions > 0 ? '#F59E0B' : 'none'} strokeWidth={2} />
            </div>
            <div>
              <div className="pomo-streak-text-title">
                Today's Streak
              </div>
              <div className="pomo-streak-text-sub">
                {sessions === 0
                  ? '0 sessions completed'
                  : `${sessions} session${sessions === 1 ? '' : 's'} completed`}
              </div>
            </div>
          </div>

          <div className="pomo-streak-count">
            {sessions}
          </div>
        </div>
      </div>
    </div>
  );
}
