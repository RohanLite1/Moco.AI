import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Headphones,
  Sparkles,
  Zap,
  CloudRain,
  Moon,
  Brain,
  Music2
} from 'lucide-react';
import '../styles/music.css';

const SOUND_LIBRARY = [
  // COLUMN 1: FOCUS (Real User Focus Audio Files)
  {
    category: 'focus',
    categoryName: 'Focus',
    icon: Brain,
    tracks: [
      {
        id: 'deep-alpha',
        title: 'Deep Alpha',
        desc: '432Hz Focus Waveform',
        audioSrc: './audio/deep-alpha.mp3',
        type: 'audio-file',
        badge: 'Focus MP3'
      },
      {
        id: 'cyber-synth',
        title: 'Cyber Synth',
        desc: 'Neon Focus Synthwave',
        audioSrc: './audio/cyber-synth.mp3',
        type: 'audio-file',
        badge: 'Focus MP3'
      },
      {
        id: 'lofi-chill',
        title: 'Lo-Fi Chill',
        desc: 'Midnight Study Beats',
        audioSrc: './audio/lofi-chill.mp3',
        type: 'audio-file',
        badge: 'Focus MP3'
      }
    ]
  },
  // COLUMN 2: MOTIVATION (Real User Motivation Audio Files)
  {
    category: 'motivation',
    categoryName: 'Motivation',
    icon: Zap,
    tracks: [
      {
        id: 'peak-drive',
        title: 'Peak Drive',
        desc: 'Gamma Energy Pulse',
        audioSrc: './audio/peak-drive.mp3',
        type: 'audio-file',
        badge: 'Motivation MP3'
      },
      {
        id: 'solar-rise',
        title: 'Solar Rise',
        desc: 'Bright Major Chords',
        audioSrc: './audio/solar-rise.mp3',
        type: 'audio-file',
        badge: 'Motivation MP3'
      },
      {
        id: 'electric-flow',
        title: 'Electric Flow',
        desc: 'Harmonic Arpeggio',
        audioSrc: './audio/electric-flow.mp3',
        type: 'audio-file',
        badge: 'Motivation MP3'
      }
    ]
  },
  // COLUMN 3: RELAX (Real User Relax Audio Files)
  {
    category: 'relax',
    categoryName: 'Relax',
    icon: CloudRain,
    tracks: [
      {
        id: 'rain-shower',
        title: 'Rain Shower',
        desc: 'Warm Filtered Rainfall',
        audioSrc: './audio/rain-shower.mp3',
        type: 'audio-file',
        badge: 'Relax MP3'
      },
      {
        id: 'zen-bowl',
        title: 'Zen Bowl',
        desc: 'Singing Harmonics',
        audioSrc: './audio/zen-bowl.mp3',
        type: 'audio-file',
        badge: 'Relax MP3'
      },
      {
        id: 'deep-relax',
        title: 'Deep Relax',
        desc: 'Gentle Calming Waves',
        audioSrc: './audio/relax.mp3',
        type: 'audio-file',
        badge: 'Relax MP3'
      }
    ]
  },
  // COLUMN 4: REST (Real User Rest Audio Files)
  {
    category: 'rest',
    categoryName: 'Rest',
    icon: Moon,
    tracks: [
      {
        id: 'theta-rest',
        title: 'Theta Rest',
        desc: '4Hz Deep Sleep Tone',
        audioSrc: './audio/theta-rest.mp3',
        type: 'audio-file',
        badge: 'Rest MP3'
      },
      {
        id: 'cosmic-drift',
        title: 'Cosmic Drift',
        desc: 'Starlight Ambient Pad',
        audioSrc: './audio/cosmic-drift.mp3',
        type: 'audio-file',
        badge: 'Rest MP3'
      },
      {
        id: 'warm-sub',
        title: 'Warm Sub',
        desc: 'Analog Low Drone',
        audioSrc: './audio/warm-sub.mp3',
        type: 'audio-file',
        badge: 'Rest MP3'
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
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const nodesRef = useRef([]);

  const currentIdx = ALL_TRACKS.findIndex((t) => t.id === currentTrack.id);

  // Stop synthetic audio cleanly
  const stopSynth = () => {
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
  };

  // Start synthetic audio engine for non-file ambient tracks
  const startSynth = (track) => {
    stopSynth();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.14, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const activeNodes = [];

      if (track.type && track.type.startsWith('noise')) {
        // Generative pink noise for rain/water
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(track.freqs ? track.freqs[0] : 400, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        activeNodes.push(whiteNoise, filter);
      } else if (track.freqs) {
        // Multi-oscillator harmonic chord generator
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

  // Start whichever engine corresponds to the track
  const startTrack = (track) => {
    if (track.audioSrc) {
      // Real Audio File playback
      stopSynth();
      const audio = audioRef.current;
      if (audio) {
        audio.src = track.audioSrc;
        audio.volume = volume;
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Audio play error:', err);
        });
      }
    } else {
      // Generative Ambient sound
      if (audioRef.current) {
        audioRef.current.pause();
      }
      startSynth(track);
    }
  };

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    stopSynth();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAll();
    } else {
      startTrack(currentTrack);
    }
  };

  const selectTrack = (track) => {
    setCurrentTrack(track);
    if (isPlaying) {
      startTrack(track);
    } else if (track.audioSrc && audioRef.current) {
      // Pre-load metadata
      audioRef.current.src = track.audioSrc;
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
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        newVol * 0.14,
        audioCtxRef.current.currentTime
      );
    }
  };

  const handleSeek = (e) => {
    if (!currentTrack.audioSrc || !audioRef.current || !durationSec) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    audioRef.current.currentTime = pct * durationSec;
    setCurrentTimeSec(pct * durationSec);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // HTML5 audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTimeSec(audio.currentTime);
    const handleLoadedMetadata = () => setDurationSec(audio.duration || 0);
    const handleEnded = () => {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAll();
  }, []);

  const progressPercent = durationSec > 0 ? (currentTimeSec / durationSec) * 100 : 0;

  return (
    <div className="music-container">
      {/* Hidden Native Audio Element for Focus Songs */}
      <audio ref={audioRef} loop preload="metadata" />

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
              <p className="music-header-sub">Focus Songs & Soundscapes</p>
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
        {/* Play/Pause/Prev/Next on top, Track Info & Progress below             */}
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

          {/* Below Controls: Track Name & Title Information */}
          <div className="music-track-info">
            <div className="music-track-title">{currentTrack.title}</div>
            <div className="music-track-sub">
              {currentTrack.categoryName} • {currentTrack.desc}
            </div>
          </div>

          {/* Interactive Scrub Progress Bar for Audio Files */}
          {currentTrack.audioSrc && (
            <div className="music-progress-wrap">
              <div
                className="music-progress-bar"
                onClick={handleSeek}
                title="Click to seek"
              >
                <div
                  className="music-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="music-time-meta">
                <span>{formatTime(currentTimeSec)}</span>
                <span>{formatTime(durationSec)}</span>
              </div>
            </div>
          )}

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
