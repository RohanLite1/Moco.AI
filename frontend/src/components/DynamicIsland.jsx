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
  Radio,
  Minimize2,
  Sun,
  Moon,
  Battery,
  Wifi,
  RotateCw,
  Zap
} from 'lucide-react';
import RobotAvatar from '../visuals3d/RobotAvatar';
import { api } from '../services/api';

/**
 * 120fps Vector OLED Cyber Face for Pill Mode
 * Ultra lightweight, zero WebGL/GPU overhead, crystal clear at all DPIs
 */
function PillRoboFace({ status = 'idle', theme = 'dark' }) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let blinkTimeout;
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
      blinkTimeout = setTimeout(triggerBlink, 3000 + Math.random() * 3200);
    };
    blinkTimeout = setTimeout(triggerBlink, 2600);
    return () => clearTimeout(blinkTimeout);
  }, []);

  const isThinking = status === 'thinking';
  const isHappy = status === 'happy';
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';

  let eyeColor = theme === 'light' ? '#0284c7' : '#38bdf8';
  if (isThinking) {
    eyeColor = '#c084fc';
  } else if (isHappy) {
    eyeColor = '#34d399';
  } else if (isListening) {
    eyeColor = '#06b6d4';
  }

  return (
    <div className={`pill-robo-face status-${status} theme-${theme}`}>
      <svg viewBox="0 0 48 48" className="pill-face-svg" aria-label="Moco Robot Face">
        <defs>
          <radialGradient id={`pillFaceBg-${theme}`} cx="50%" cy="40%" r="55%">
            {theme === 'light' ? (
              <>
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </>
            )}
          </radialGradient>
          <filter id="pillEyeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Circular Head */}
        <circle
          cx="24"
          cy="24"
          r="22"
          fill={`url(#pillFaceBg-${theme})`}
          stroke={eyeColor}
          strokeWidth="1.2"
          strokeOpacity="0.45"
        />

        {/* Cyber Ear Notches */}
        <path
          d="M 9 14 L 6 9 L 14 11 Z"
          fill={eyeColor}
          fillOpacity={isHappy ? 0.9 : 0.45}
          className={isHappy ? "ear-twitch-left" : ""}
        />
        <path
          d="M 39 14 L 42 9 L 34 11 Z"
          fill={eyeColor}
          fillOpacity={isHappy ? 0.9 : 0.45}
          className={isHappy ? "ear-twitch-right" : ""}
        />

        {/* Visor Area */}
        <rect
          x="10"
          y="15"
          width="28"
          height="16"
          rx="7"
          fill={theme === 'light' ? '#0f172a' : '#030712'}
          stroke={eyeColor}
          strokeWidth="0.8"
          strokeOpacity="0.5"
        />

        {/* Thinking Scanner Bar */}
        {isThinking && (
          <line
            x1="12"
            y1="23"
            x2="36"
            y2="23"
            stroke="#c084fc"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="thinking-scanner-line"
            filter="url(#pillEyeGlow)"
          />
        )}

        {/* Eyes Rendering */}
        {blink && !isHappy ? (
          // Blinking Eyelid Slits
          <>
            <line x1="14" y1="23" x2="21" y2="23" stroke={eyeColor} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="27" y1="23" x2="34" y2="23" stroke={eyeColor} strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : isHappy ? (
          // Joyful Happy Crescent Eyes (^ ^)
          <>
            <path
              d="M 14 24 Q 17.5 19 21 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2.2"
              strokeLinecap="round"
              filter="url(#pillEyeGlow)"
            />
            <path
              d="M 27 24 Q 30.5 19 34 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2.2"
              strokeLinecap="round"
              filter="url(#pillEyeGlow)"
            />
          </>
        ) : (
          // OLED Glowing Pupils
          <>
            {/* Left Eye */}
            <ellipse
              cx="17.5"
              cy="23"
              rx={isListening ? "3.6" : "3.0"}
              ry={isListening ? "4.0" : isSpeaking ? "3.6" : "3.2"}
              fill={eyeColor}
              filter="url(#pillEyeGlow)"
              className={isSpeaking ? "eye-speaking-pulse" : ""}
            />
            <circle cx="16.5" cy="21.8" r="1.0" fill="#ffffff" />

            {/* Right Eye */}
            <ellipse
              cx="30.5"
              cy="23"
              rx={isListening ? "3.6" : "3.0"}
              ry={isListening ? "4.0" : isSpeaking ? "3.6" : "3.2"}
              fill={eyeColor}
              filter="url(#pillEyeGlow)"
              className={isSpeaking ? "eye-speaking-pulse" : ""}
            />
            <circle cx="29.5" cy="21.8" r="1.0" fill="#ffffff" />
          </>
        )}

        {/* Cute Sony Aibo Sensor Nose */}
        <circle cx="24" cy="33.5" r="1.4" fill={theme === 'light' ? '#334155' : '#475569'} />
        <circle cx="23.7" cy="33.2" r="0.4" fill="#94a3b8" />

        {/* Subtle Happy Mouth Smile Notch */}
        {isHappy && (
          <path
            d="M 21.5 36.5 Q 24 38.5 26.5 36.5"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}

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
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [nowPlayingTitle, setNowPlayingTitle] = useState('');
  const recognitionRef = useRef(null);
  const latestTranscriptRef = useRef('');

  // Sync with global music playback status
  useEffect(() => {
    const handleMusicStatus = (e) => {
      setIsMusicPlaying(Boolean(e.detail?.isPlaying));
      setNowPlayingTitle(e.detail?.track?.title || '');
    };
    window.addEventListener('moco:music-status', handleMusicStatus);
    return () => window.removeEventListener('moco:music-status', handleMusicStatus);
  }, []);

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

  // Unified Voice Command Handler
  const executeVoiceCommand = async (finalCmd) => {
    if (!finalCmd || finalCmd === 'Listening...' || finalCmd.startsWith('Listening')) {
      onStatusChange?.('idle');
      setVoiceTranscript('');
      setVoiceStatusText('');
      return;
    }

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
      } else if (res?.action === 'ROBOT_ACTION' && res?.target) {
        window.dispatchEvent(
          new CustomEvent('moco:robot-action', { detail: { action: res.target } })
        );
        if (res.target === 'dance' && !isMusicPlaying) {
          setActiveTab?.('music');
        }
        const actMsg = res?.reply || `Moco is performing ${res.target}!`;
        setVoiceStatusText(actMsg);
        setVoiceAnswer(actMsg);
        onStatusChange?.('happy');
        setTimeout(() => {
          onStatusChange?.('idle');
          setVoiceStatusText('');
        }, 3500);
      } else {
        const answerMsg = res?.reply || 'Command completed successfully.';
        setVoiceStatusText(`"${answerMsg}"`);
        setVoiceAnswer(answerMsg);
        onStatusChange?.('speaking');
        setTimeout(() => {
          onStatusChange?.('idle');
          setVoiceStatusText('');
        }, 5000);
      }
    } catch (err) {
      console.error('Voice routing error:', err);
      const errMsg = `Error: ${err.message || 'Could not process query'}`;
      onStatusChange?.('idle');
      setVoiceAnswer(errMsg);
      setVoiceStatusText(errMsg);
    }
  };

  // Initialize Speech Recognition once for browser environment fallback
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
      await executeVoiceCommand(finalCmd);
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.abort(); } catch (_) {}
    };
  }, [onStatusChange, setActiveTab]);

  const handleMicClick = async (e) => {
    e?.stopPropagation();

    // 1. Electron Desktop Environment: Native Windows Speech Engine (100% offline & packaged exe compatible)
    if (typeof window !== 'undefined' && window.mocoApi && typeof api.listenNativeVoice === 'function') {
      if (aiStatus === 'listening') {
        try { api.stopNativeVoice(); } catch (_) {}
        onStatusChange?.('idle');
        setVoiceTranscript('');
        setVoiceStatusText('');
        return;
      }

      latestTranscriptRef.current = '';
      setVoiceTranscript('Listening (Windows Speech)...');
      setVoiceStatusText('Listening... Speak into microphone');
      setVoiceAnswer('');
      onStatusChange?.('listening');

      try {
        const result = await api.listenNativeVoice();
        if (result && result.success && result.text) {
          latestTranscriptRef.current = result.text;
          setVoiceTranscript(result.text);
          await executeVoiceCommand(result.text);
        } else {
          onStatusChange?.('idle');
          setVoiceTranscript('');
          setVoiceStatusText('');
        }
      } catch (err) {
        console.error('Native speech error:', err);
        onStatusChange?.('idle');
        setVoiceTranscript('');
        setVoiceStatusText('');
      }
      return;
    }

    // 2. Browser Environment Fallback: WebSpeech API (Chrome/Edge localhost)
    if (!recognitionRef.current) {
      if (typeof api.listenNativeVoice === 'function') {
        if (aiStatus === 'listening') {
          try { api.stopNativeVoice(); } catch (_) {}
          onStatusChange?.('idle');
          setVoiceTranscript('');
          setVoiceStatusText('');
          return;
        }
        latestTranscriptRef.current = '';
        setVoiceTranscript('Listening...');
        setVoiceStatusText('Listening... Speak now');
        setVoiceAnswer('');
        onStatusChange?.('listening');
        try {
          const result = await api.listenNativeVoice();
          if (result && result.success && result.text) {
            latestTranscriptRef.current = result.text;
            setVoiceTranscript(result.text);
            await executeVoiceCommand(result.text);
          } else {
            onStatusChange?.('idle');
            setVoiceTranscript('');
            setVoiceStatusText('');
          }
        } catch (_) {
          onStatusChange?.('idle');
          setVoiceTranscript('');
          setVoiceStatusText('');
        }
        return;
      }
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
    { id: 'wave', label: 'Wave', icon: Sparkles, isAction: true },
    { id: 'spin', label: 'Spin', icon: RotateCw, isAction: true },
    { id: 'cheer', label: 'Cheer', icon: Zap, isAction: true },
    { id: 'dance', label: 'Dance', icon: Music, isAction: true },
    { id: 'listening', label: 'Listen', icon: Mic, isAction: false },
    { id: 'thinking', label: 'Think', icon: Brain, isAction: false }
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
        {/* 1. WIDE COMPACT PILL LAYER (Always mounted, hardware accelerated)    */}
        {/* =================================================================== */}
        <div className={`island-pill-layer ${isExpanded ? 'layer-hidden' : 'layer-visible'}`}>
          {/* Left: 120fps Cyber RoboDog Face & Status */}
          <div className="pill-left">
            <div className="pill-robot-avatar">
              <PillRoboFace
                status={aiStatus}
                theme={activeTheme}
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
                ) : isMusicPlaying && nowPlayingTitle ? (
                  <span style={{ color: '#38bdf8', fontWeight: 500 }}>{`Playing: ${nowPlayingTitle}`}</span>
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
          {(() => {
            const isAudioActive = isMusicPlaying || aiStatus === 'speaking' || aiStatus === 'listening';
            return (
              <div
                className={`pill-center ${isAudioActive ? 'active' : 'idle'}`}
                title={isMusicPlaying ? `Now Playing: ${nowPlayingTitle}` : "Live Audio Waveform Visualizer"}
              >
                {[12, 18, 9, 22, 14, 26, 16, 24, 11, 20, 15, 19, 10, 14].map((h, i) => (
                  <div
                    key={i}
                    className={`soundwave-bar ${isAudioActive ? 'active' : 'idle'}`}
                    style={{
                      height: `${h}px`,
                      animationDelay: `${(i * 0.07).toFixed(2)}s`
                    }}
                  />
                ))}
              </div>
            );
          })()}

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
        </div>

        {/* =================================================================== */}
        {/* 2. EXPANDED WIDE DYNAMIC ISLAND LAYER (Always mounted, zero lag)     */}
        {/* =================================================================== */}
        <div className={`island-expanded-layer ${isExpanded ? 'layer-visible' : 'layer-hidden'}`}>
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
              {/* 3D RoboDog Stage (Warm in memory, pauses render when collapsed) */}
              <div className="island-robot-stage">
                <RobotAvatar
                  status={aiStatus}
                  isMusicPlaying={isMusicPlaying}
                  compact={false}
                  active={isExpanded}
                  theme={activeTheme}
                  onRobotClick={() => {
                    const actions = ['spin', 'wave', 'cheer', 'dance'];
                    const chosen = actions[Math.floor(Math.random() * actions.length)];
                    window.dispatchEvent(
                      new CustomEvent('moco:robot-action', { detail: { action: chosen } })
                    );
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

              {/* Robotic Dog Expression & Action Commands */}
              <div className="island-expression-bar">
                <div className="expression-title">Robot Actions & Commands</div>
                <div className="expression-grid">
                  {expressions.map((exp) => {
                    const Icon = exp.icon;
                    const isActive = exp.isAction
                      ? false
                      : aiStatus === exp.id;
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => {
                          if (exp.isAction) {
                            window.dispatchEvent(
                              new CustomEvent('moco:robot-action', {
                                detail: { action: exp.id }
                              })
                            );
                            if (exp.id === 'dance' && !isMusicPlaying) {
                              setActiveTab?.('music');
                            }
                          } else if (exp.id === 'listening') {
                            handleMicClick();
                          } else {
                            onStatusChange?.(exp.id);
                          }
                        }}
                        className={`expression-btn ${isActive ? 'active' : ''}`}
                        title={`Make Moco ${exp.label}`}
                      >
                        <Icon size={12} />
                        <span>{exp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Right Column: Active Widget Deck (Maintained in DOM for 0ms tab recovery) */}
            <main className="island-widget-body">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
