import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Radio,
  Headphones,
  Sparkles,
  Zap,
  CloudRain,
  Moon,
  Brain
} from 'lucide-react';
import '../styles/music.css';

const SOUND_LIBRARY = [
  // COLUMN 1: FOCUS 🧠
  {
    category: 'focus',
    categoryName: 'Focus 🧠',
    icon: Brain,
    tracks: [
      {
        id: 'alpha-432',
        title: 'Deep Alpha',
        desc: '432Hz Binaural Beat',
        type: 'binaural',
        freqs: [216, 432, 440],
        badge: 'Focus'
      },
      {
        id: 'cyber-synth',
        title: 'Cyber Synth',
        desc: 'Neon Focus Chords',
        type: 'synth',
        freqs: [130.81, 164.81, 196.0, 246.94],
        badge: 'Synth'
      },
      {
        id: 'lofi-study',
        title: 'Lo-Fi Chill',
        desc: 'Midnight Study Haze',
        type: 'lofi',
        freqs: [146.83, 174.61, 220.0, 261.63, 329.63],
        badge: 'Lo-Fi'
      }
    ]
  },
  // COLUMN 2: MOTIVATION ⚡
  {
    category: 'motivation',
    categoryName: 'Motivation ⚡',
    icon: Zap,
    tracks: [
      {
        id: 'peak-drive',
        title: 'Peak Drive',
        desc: 'Gamma Energy Pulse',
        type: 'gamma',
        freqs: [200, 240, 480],
        badge: 'Energy'
      },
      {
        id: 'solar-rise',
        title: 'Solar Rise',
        desc: 'Bright Major Chords',
        type: 'synth',
        freqs: [174.61, 220.0, 261.63, 349.23],
        badge: 'Uplift'
      },
      {
        id: 'electric-zen',
        title: 'Electric Flow',
        desc: 'Harmonic Arpeggio',
        type: 'synth',
        freqs: [220, 277.18, 329.63, 440],
        badge: 'Clarity'
      }
    ]
  },
  // COLUMN 3: RELAX 🌧️
  {
    category: 'relax',
    categoryName: 'Relax 🌧️',
    icon: CloudRain,
    tracks: [
      {
        id: 'rain-shower',
        title: 'Rain Shower',
        desc: 'Warm Filtered Noise',
        type: 'noise-rain',
        freqs: [380, 800],
        badge: 'Rain'
      },
      {
        id: 'tibetan-bowl',
        title: 'Zen Bowl',
        desc: 'Singing Harmonics',
        type: 'zen',
        freqs: [108, 216, 324, 432],
        badge: 'Zen'
      },
      {
        id: 'forest-stream',
        title: 'Forest Stream',
        desc: 'Gentle Flowing Water',
        type: 'noise-water',
        freqs: [600, 1100],
        badge: 'Nature'
      }
    ]
  },
  // COLUMN 4: REST 🌙
  {
    category: 'rest',
    categoryName: 'Rest 🌙',
    icon: Moon,
    tracks: [
      {
        id: 'theta-rest',
        title: 'Theta Rest',
        desc: '4Hz Deep Sleep Tone',
        type: 'binaural',
        freqs: [100, 104, 208],
        badge: 'Theta'
      },
      {
        id: 'cosmic-drift',
        title: 'Cosmic Drift',
        desc: 'Starlight Ambient Pad',
        type: 'synth',
        freqs: [98.0, 146.83, 196.0, 293.66],
        badge: 'Ambient'
      },
      {
        id: 'warm-sub',
        title: 'Warm Sub',
        desc: 'Analog Low Drone',
        type: 'synth',
        freqs: [55.0, 110.0, 165.0],
        badge: 'Drone'
      }
    ]
  }
];

// Flat list for Prev/Next navigation
const ALL_TRACKS = SOUND_LIBRARY.flatMap((col) =>
  col.tracks.map((t) => ({ ...t, categoryName: col.categoryName }))
);

export default function MusicWidget() {
  const [currentTrack, setCurrentTrack] = useState(ALL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const nodesRef = useRef([]);

  const currentIdx = ALL_TRACKS.findIndex((t) => t.id === currentTrack.id);

  // Stop generative audio cleanly
  const stopAudio = () => {
    nodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    nodesRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  // Start generative audio engine for selected track
  const startAudio = (track) => {
    stopAudio();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.14, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const activeNodes = [];

      if (track.type.startsWith('noise')) {
        // Noise buffer generator for Rain / Stream
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink noise filter
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(track.freqs[0], ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        activeNodes.push(whiteNoise, filter);
      } else {
        // Multi-oscillator synthesis (Harmonics, Binaural, Synthwave pads)
        track.freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const subGain = ctx.createGain();
          subGain.gain.value = 0.22 / Math.sqrt(track.freqs.length);

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          osc.detune.setValueAtTime((idx - 1) * 3, ctx.currentTime);

          osc.connect(subGain);
          subGain.connect(masterGain);
          osc.start();

          activeNodes.push(osc, subGain);
        });
      }

      nodesRef.current = activeNodes;
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio synthesis notice:', err);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio(currentTrack);
    }
  };

  const selectTrack = (track) => {
    setCurrentTrack(track);
    if (isPlaying) {
      startAudio(track);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentIdx + 1) % ALL_TRACKS.length;
    selectTrack(ALL_TRACKS[nextIdx]);
  };

  const handlePrev = () => {
    const prevIdx = (currentIdx - 1 + ALL_TRACKS.length) % ALL_TRACKS.length;
    selectTrack(ALL_TRACKS[prevIdx]);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        newVol * 0.14,
        audioCtxRef.current.currentTime
      );
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="music-container">
      <div className="music-card">
        {/* =================================================================== */}
        {/* 1. TOP HEADER                                                       */}
        {/* =================================================================== */}
        <div className="music-header">
          <div className="music-header-left">
            <div className="music-icon-badge">
              <Headphones size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="music-header-title">Neural Ambience</h2>
              <p className="music-header-sub">Generative Soundscape Engine</p>
            </div>
          </div>

          <div className="music-live-badge">
            {isPlaying ? (
              <>
                <span className="music-pulse-dot" />
                <span>NOW PLAYING</span>
              </>
            ) : (
              <span>READY</span>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. AUDIO PLAYER DECK                                                */}
        {/* Transport Controls Row on top, then Title & Details below           */}
        {/* =================================================================== */}
        <div className="music-player-deck">
          {/* Controls Row: Previous, Play/Pause, Next */}
          <div className="music-transport-row">
            {/* Previous Track Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="music-btn-nav"
              title="Previous Soundscape"
            >
              <SkipBack size={17} strokeWidth={2.2} />
            </button>

            {/* Prominent Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className={`music-btn-play ${isPlaying ? 'playing' : ''}`}
            >
              {isPlaying ? (
                <>
                  <Pause size={16} strokeWidth={2.4} />
                  <span>Pause Audio</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" strokeWidth={0} />
                  <span>Start Soundscape</span>
                </>
              )}
            </button>

            {/* Next Track Button */}
            <button
              type="button"
              onClick={handleNext}
              className="music-btn-nav"
              title="Next Soundscape"
            >
              <SkipForward size={17} strokeWidth={2.2} />
            </button>
          </div>

          {/* Below Controls: Track Name & Title Things */}
          <div className="music-track-info">
            <div className="music-track-title">{currentTrack.title}</div>
            <div className="music-track-sub">
              {currentTrack.categoryName} • {currentTrack.desc}
            </div>
          </div>

          {/* Real-Time Bouncing Equalizer Bars */}
          <div className="music-equalizer">
            {[10, 20, 14, 26, 12, 22, 16, 24, 8, 18, 14, 25, 18, 22, 12, 16].map(
              (h, idx) => (
                <div
                  key={idx}
                  className="music-equalizer-bar"
                  style={{
                    height: isPlaying
                      ? `${Math.max(4, h * (volume + 0.35))}px`
                      : '4px',
                    opacity: isPlaying ? 0.95 : 0.3
                  }}
                />
              )
            )}
          </div>

          {/* Volume Slider Scrubber */}
          <div className="music-volume-row">
            <span className="music-volume-icon">
              {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="music-volume-slider"
              title="Volume Control"
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* 3. SOUNDSCAPE COLUMNS (FOCUS, MOTIVATION, RELAX, REST)              */}
        {/* =================================================================== */}
        <div className="music-section-title">
          <Sparkles size={13} color="#0891b2" />
          <span>Soundscape Library</span>
        </div>

        <div className="music-columns-grid">
          {SOUND_LIBRARY.map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.category} className="music-column">
                <div className="music-column-header">
                  <Icon size={12} strokeWidth={2.2} color="#0891b2" />
                  <span>{col.categoryName}</span>
                </div>

                {col.tracks.map((track) => {
                  const isSelected = currentTrack.id === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => selectTrack(track)}
                      className={`music-sound-btn ${isSelected ? 'active' : ''}`}
                    >
                      <div className="music-sound-btn-title">
                        {track.title}
                      </div>
                      <div className="music-sound-btn-desc">
                        {track.badge}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
