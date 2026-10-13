import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  Pin,
  X,
  MessageSquare,
  Timer,
  CheckSquare,
  Music,
  Gamepad2,
  Mic,
  Brain,
  Volume2,
  Smile,
  Radio,
  Minimize2,
  Sun,
  Moon,
  Battery,
  Wifi
} from 'lucide-react';
import RobotAvatar from '../visuals3d/RobotAvatar';
import { api } from '../services/api';

export default function DynamicIsland({
  activeTab,
  setActiveTab,
  aiStatus = 'idle',
  onStatusChange,
  children
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // ---------------------------------------------------------------------------
  // SYSTEM COLOR SCHEME DETECTION & THEME STATE
  // ---------------------------------------------------------------------------
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const [themePreference, setThemePreference] = useState('auto'); // 'auto' | 'dark' | 'light'

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute active theme
  const activeTheme =
    themePreference === 'auto'
      ? systemIsDark
        ? 'dark'
        : 'light'
      : themePreference;

  // Toggle Theme: Auto -> Dark -> Light -> Auto
  const cycleTheme = (e) => {
    e?.stopPropagation();
    setThemePreference((prev) => {
      if (prev === 'auto') return 'dark';
      if (prev === 'dark') return 'light';
      return 'auto';
    });
  };

  const tabs = [
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer },
    { id: 'todo', label: 'Tasks', icon: CheckSquare },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'games', label: 'Games', icon: Gamepad2 }
  ];

  const expressions = [
    { id: 'idle', label: 'Idle', icon: Radio },
    { id: 'listening', label: 'Listen', icon: Mic },
    { id: 'thinking', label: 'Think', icon: Brain },
    { id: 'speaking', label: 'Speak', icon: Volume2 },
    { id: 'happy', label: 'Happy', icon: Smile }
  ];

  const handleTogglePin = async (e) => {
    e?.stopPropagation();
    const pinned = await api.togglePin();
    setIsPinned(Boolean(pinned));
  };

  const handleClose = (e) => {
    e?.stopPropagation();
    api.hideWindow();
  };

  const handlePillClick = () => {
    setIsExpanded(true);
  };

  const handleMinimize = (e) => {
    e?.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <div className={`dynamic-island-viewport ${activeTheme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      {/* Dynamic Island Container */}
      <div
        className={`dynamic-island-shell ${isExpanded ? 'expanded' : 'pill'}`}
        onClick={!isExpanded ? handlePillClick : undefined}
      >
        {/* =================================================================== */}
        {/* 1. WIDE COMPACT PILL MODE (Top of Screen)                           */}
        {/* =================================================================== */}
        {!isExpanded ? (
          <>
            {/* Left: 3D RoboDog Face & Status */}
            <div className="pill-left">
              <div className="pill-robot-avatar">
                <RobotAvatar
                  status={aiStatus}
                  compact={true}
                  theme={activeTheme}
                  className="w-full h-full"
                />
              </div>

              <div className="pill-meta">
                <div className="pill-title">
                  <span className={`pill-status-dot ${aiStatus}`} />
                  <span>Moco Robodog</span>
                </div>
                <div className="pill-subtitle">
                  {aiStatus === 'thinking' && 'Analyzing query...'}
                  {aiStatus === 'speaking' && 'Streaming voice audio...'}
                  {aiStatus === 'listening' && 'Listening attentively...'}
                  {aiStatus === 'happy' && 'Ready for your command!'}
                  {aiStatus === 'idle' && 'AIBO_UNIT_01 • Click to expand'}
                </div>
              </div>
            </div>

            {/* Middle: Live Audio Waveform Equalizer */}
            <div className="pill-center" title="Audio Waveform Visualizer">
              {[12, 18, 8, 22, 14, 26, 16, 24, 10, 20, 14, 18, 8, 15].map((h, i) => (
                <div
                  key={i}
                  className="soundwave-bar"
                  style={{
                    height: aiStatus === 'speaking' ? `${h}px` : aiStatus === 'listening' ? `${Math.max(6, h * 0.7)}px` : '5px',
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              ))}
            </div>

            {/* Right: Telemetry & Quick Action Controls */}
            <div className="pill-actions">
              {/* Battery & Telemetry Badge */}
              <div className="pill-badge" title="Robodog Core Battery 98%">
                <Battery size={13} color={activeTheme === 'light' ? '#0284c7' : '#38bdf8'} />
                <span>98%</span>
              </div>

              {/* Theme Indicator & Toggle */}
              <button
                type="button"
                className="pill-btn"
                title={`Theme: ${themePreference.toUpperCase()} (${activeTheme}). Click to cycle.`}
                onClick={cycleTheme}
              >
                {activeTheme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
              </button>

              {/* Mic / Listen Toggle */}
              <button
                type="button"
                className="pill-btn"
                title="Voice Listen Toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(aiStatus === 'listening' ? 'idle' : 'listening');
                }}
              >
                <Mic size={14} />
              </button>

              {/* Expand Chevron */}
              <button
                type="button"
                className="pill-btn"
                title="Expand Dynamic Island"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
              >
                <ChevronDown size={15} />
              </button>
            </div>
          </>
        ) : (
          /* =================================================================== */
          /* 2. EXPANDED WIDE DYNAMIC ISLAND MODE                                */
          /* =================================================================== */
          <>
            {/* Top Island Header */}
            <header className="island-header drag-region">
              <div className="island-brand no-drag">
                <Sparkles size={16} color={activeTheme === 'light' ? '#0284c7' : '#06b6d4'} />
                <span>Moco.AI</span>
                <div className="island-status-pill">
                  <span className={`pill-status-dot ${aiStatus}`} />
                  <span>{aiStatus.toUpperCase()}</span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="island-tabs no-drag">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`island-tab-btn ${isActive ? 'active' : ''}`}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Header Action Controls */}
              <div className="island-controls no-drag">
                {/* Theme Switcher Button */}
                <button
                  type="button"
                  onClick={cycleTheme}
                  className="island-control-btn"
                  title={`Current: ${themePreference.toUpperCase()} (${activeTheme}). Click to change.`}
                >
                  {activeTheme === 'light' ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                {/* Pin Button */}
                <button
                  type="button"
                  onClick={handleTogglePin}
                  className={`island-control-btn ${isPinned ? 'text-cyan-400' : ''}`}
                  title={isPinned ? 'Pinned Always On Top' : 'Pin Always On Top'}
                >
                  <Pin size={14} />
                </button>

                {/* Minimize to Pill */}
                <button
                  type="button"
                  onClick={handleMinimize}
                  className="island-control-btn"
                  title="Collapse to Dynamic Island Pill"
                >
                  <Minimize2 size={14} />
                </button>

                {/* Close / Hide Window */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="island-control-btn close"
                  title="Hide Window (Alt+Space)"
                >
                  <X size={15} />
                </button>
              </div>
            </header>

            {/* Island Body Grid */}
            <div className="island-main">
              {/* Left Column: 3D RoboDog & Expression Controls */}
              <aside className="island-robot-deck">
                {/* 3D RoboDog Stage */}
                <div className="island-robot-stage">
                  <RobotAvatar
                    status={aiStatus}
                    compact={false}
                    theme={activeTheme}
                    onRobotClick={() => {
                      onStatusChange?.('happy');
                      setTimeout(() => onStatusChange?.('idle'), 2500);
                    }}
                  />
                </div>

                {/* Robotic Dog Expression Commands */}
                <div className="island-expression-bar">
                  <div className="expression-title">Command Expressions</div>
                  <div className="expression-grid">
                    {expressions.map((exp) => {
                      const Icon = exp.icon;
                      const isActive = aiStatus === exp.id;
                      return (
                        <button
                          key={exp.id}
                          type="button"
                          onClick={() => onStatusChange?.(exp.id)}
                          className={`expression-btn ${isActive ? 'active' : ''}`}
                        >
                          <Icon size={12} />
                          <span>{exp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              {/* Right Column: Active Widget Deck */}
              <main className="island-widget-body">
                {children}
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
