import React, { useState, useEffect, useRef } from 'react';
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
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatusText, setVoiceStatusText] = useState('');
  const [voiceAnswer, setVoiceAnswer] = useState('');
  const [batteryPercent, setBatteryPercent] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');

  // Real device battery telemetry
  useEffect(() => {
    let isMounted = true;

    const queryBattery = async () => {
      // 1. Try modern browser Battery API (Edge / Chrome / Chromium)
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          const battery = await navigator.getBattery();
          if (isMounted) {
            setBatteryPercent(Math.round(battery.level * 100));
            setIsCharging(Boolean(battery.charging));
          }
          const onLevelChange = () => {
            if (isMounted) setBatteryPercent(Math.round(battery.level * 100));
          };
          const onChargingChange = () => {
            if (isMounted) setIsCharging(Boolean(battery.charging));
          };
          battery.addEventListener('levelchange', onLevelChange);
          battery.addEventListener('chargingchange', onChargingChange);
          return;
        } catch (_) {}
      }

      // 2. Query Moco backend API (Windows CIM Win32_Battery via Electron IPC or local dev server)
      try {
        const info = await api.getDeviceBattery?.();
        if (info && info.hasBattery && isMounted) {
          setBatteryPercent(info.percent);
          setIsCharging(Boolean(info.isCharging));
        }
      } catch (_) {}
    };

    queryBattery();
    const interval = setInterval(queryBattery, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Initialize Speech Recognition once without tearing down on each transcript update
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      latestTranscriptRef.current = '';
      setVoiceTranscript('Listening...');
      setVoiceStatusText('');
      onStatusChange?.('listening');
    };

    recognition.onresult = (event) => {
      let fullText = '';
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript;
      }
      latestTranscriptRef.current = fullText;
      setVoiceTranscript(fullText);
      setVoiceStatusText('');
    };

    recognition.onerror = (e) => {
      console.warn('Voice recognition note:', e.error);
      onStatusChange?.('idle');
      setVoiceTranscript('');
      setVoiceStatusText('');
    };

    recognition.onend = async () => {
      const finalCmd = latestTranscriptRef.current.trim();
      if (finalCmd && finalCmd !== 'Listening...') {
        onStatusChange?.('thinking');
        setVoiceStatusText(`Routing: "${finalCmd}"...`);
        try {
          const res = await api.processVoiceCommand(finalCmd);
          if (res?.action === 'NAVIGATE' && res?.target) {
            setActiveTab?.(res.target);
            const navMsg = `Switched to ${res.target.toUpperCase()} tab.`;
            setVoiceStatusText(navMsg);
            setVoiceAnswer(navMsg);
            onStatusChange?.('happy');
            setTimeout(() => {
              onStatusChange?.('idle');
              setVoiceStatusText('');
            }, 3000);
          } else {
            const answerMsg = res?.reply || 'Command completed successfully.';
            setVoiceStatusText(`"${answerMsg}"`);
            setVoiceAnswer(answerMsg);
            onStatusChange?.('speaking');
            setTimeout(() => {
              onStatusChange?.('idle');
              setVoiceStatusText('');
            }, 4500);
          }
        } catch (err) {
          console.error('Voice routing error:', err);
          const errMsg = `Error: ${err.message || 'Could not process query'}`;
          onStatusChange?.('idle');
          setVoiceAnswer(errMsg);
          setVoiceStatusText(errMsg);
        }
      } else {
        onStatusChange?.('idle');
        setVoiceTranscript('');
        setVoiceStatusText('');
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.abort(); } catch (_) {}
    };
  }, [onStatusChange, setActiveTab]);

  const handleMicClick = (e) => {
    e?.stopPropagation();
    if (!recognitionRef.current) {
      onStatusChange?.(aiStatus === 'listening' ? 'idle' : 'listening');
      return;
    }
    if (aiStatus === 'listening') {
      try { recognitionRef.current.stop(); } catch (_) {}
    } else {
      latestTranscriptRef.current = '';
      setVoiceTranscript('');
      setVoiceStatusText('');
      setVoiceAnswer(''); // Clear prior answer when initiating new voice input
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

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

  // Synchronize document-level theme classes and dataset
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activeTheme);
      document.body.classList.remove('theme-light', 'theme-dark');
      document.body.classList.add(`theme-${activeTheme}`);
    }
  }, [activeTheme]);

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
    { id: 'happy', label: 'Happy', icon: Smile },
    { id: 'listening', label: 'Listen', icon: Mic },
    { id: 'thinking', label: 'Think', icon: Brain },
    { id: 'speaking', label: 'Speak', icon: Volume2 }
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
    <div
      className={`dynamic-island-viewport ${activeTheme === 'light' ? 'theme-light' : 'theme-dark'}`}
      data-theme={activeTheme}
    >
      {/* Dynamic Island Container */}
      <div
        className={`dynamic-island-shell ${isExpanded ? 'expanded' : 'pill'} ${activeTheme === 'light' ? 'theme-light' : 'theme-dark'}`}
        data-theme={activeTheme}
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
                  {voiceStatusText ? (
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{voiceStatusText}</span>
                  ) : voiceTranscript ? (
                    <span style={{ color: '#38bdf8' }}>{`Hearing: "${voiceTranscript}"`}</span>
                  ) : (
                    <>
                      {aiStatus === 'thinking' && 'Analyzing query...'}
                      {aiStatus === 'speaking' && 'Streaming voice audio...'}
                      {aiStatus === 'listening' && 'Listening attentively...'}
                      {aiStatus === 'happy' && 'Joyful & Ready!'}
                      {(aiStatus === 'ready' || aiStatus === 'idle' || !aiStatus) && 'Moco Online • Click to expand'}
                    </>
                  )}
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
              <div
                className="pill-badge"
                title={`Device Battery: ${batteryPercent}%${isCharging ? ' (Charging)' : ''}`}
              >
                <Battery size={13} color={activeTheme === 'light' ? '#0284c7' : '#38bdf8'} />
                <span>{batteryPercent}%</span>
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
                className={`pill-btn ${aiStatus === 'listening' ? 'text-red-400 border-red-500' : ''}`}
                title={aiStatus === 'listening' ? 'Stop Listening' : 'Voice Command Mic'}
                onClick={handleMicClick}
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
                  <span>
                    {voiceStatusText ? voiceStatusText : voiceTranscript ? `Hearing: "${voiceTranscript}"` : ((aiStatus === 'idle' || aiStatus === 'ready' || !aiStatus) ? 'ONLINE' : aiStatus.toUpperCase())}
                  </span>
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
                      setTimeout(() => onStatusChange?.('ready'), 2500);
                    }}
                  />
                </div>

                {/* Voice Command Response Box beneath 3D Robot */}
                <div className="voice-answer-box">
                  <div className="voice-answer-badge">
                    <div className="voice-answer-badge-left">
                      <Sparkles size={12} color={activeTheme === 'light' ? '#0284c7' : '#38bdf8'} />
                      <span>{voiceAnswer ? 'MOCO RESPONSE' : aiStatus === 'listening' ? 'LISTENING...' : aiStatus === 'thinking' ? 'THINKING...' : 'VOICE ASSISTANT'}</span>
                    </div>
                    {voiceAnswer && (
                      <button
                        type="button"
                        className="voice-answer-close"
                        onClick={() => setVoiceAnswer('')}
                        title="Dismiss answer"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <div className="voice-answer-text">
                    {voiceAnswer ? (
                      voiceAnswer
                    ) : voiceTranscript && voiceTranscript !== 'Listening...' ? (
                      <span className="hearing-text">{`Hearing: "${voiceTranscript}"`}</span>
                    ) : aiStatus === 'listening' ? (
                      <span className="hearing-text">Listening to your voice... Speak now!</span>
                    ) : aiStatus === 'thinking' ? (
                      <span className="thinking-text">Searching web & analyzing...</span>
                    ) : (
                      <span className="idle-placeholder">
                        Click 🎙️ or ask a question (e.g. "What is the weather today?", "Open Pomodoro", "Calculate 25 * 4")
                      </span>
                    )}
                  </div>
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
                          onClick={() => {
                            if (exp.id === 'listening') {
                              handleMicClick();
                            } else {
                              onStatusChange?.(exp.id);
                            }
                          }}
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
