import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Disc3,
  Sparkles,
  Headphones,
  Sliders
} from 'lucide-react';

export default function MusicWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [channel, setChannel] = useState('synthwave'); // synthwave | lofi | alpha
  const [volume, setVolume] = useState(0.4);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const oscRef = useRef([]);

  const channels = [
    {
      id: 'synthwave',
      title: 'Neon Horizon',
      genre: 'Cyber Synthwave',
      freqs: [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3 (Cmaj7 chord)
      color: '#06b6d4'
    },
    {
      id: 'lofi',
      title: 'Midnight Rain',
      genre: 'Lo-Fi Chill Chords',
      freqs: [146.83, 174.61, 220.00, 261.63], // D3, F3, A3, C4 (Dm7 chord)
      color: '#a855f7'
    },
    {
      id: 'alpha',
      title: 'Alpha Wave 432Hz',
      genre: 'Binaural Focus Drone',
      freqs: [108.0, 216.0, 432.0], // 432Hz subharmonic alignment
      color: '#10b981'
    }
  ];

  const currentChannel = channels.find(c => c.id === channel) || channels[0];

  const stopAudio = () => {
    oscRef.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    oscRef.current = [];
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const startAudio = (channelObj) => {
    stopAudio();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const activeFreqs = channelObj.freqs;
      const oscillators = activeFreqs.map((f, idx) => {
        const osc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subGain.gain.value = 0.25;

        // Waveform shape
        osc.type = channelObj.id === 'synthwave' ? (idx % 2 === 0 ? 'triangle' : 'sine') : 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        // Gentle stereo panning or detune
        osc.detune.setValueAtTime((idx - 1) * 4, ctx.currentTime);

        osc.connect(subGain);
        subGain.connect(masterGain);
        osc.start();
        return osc;
      });

      oscRef.current = oscillators;
      setIsPlaying(true);
    } catch (e) {
      console.error('Audio initialization notice:', e);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio(currentChannel);
    }
  };

  const handleChannelChange = (newChan) => {
    setChannel(newChan.id);
    if (isPlaying) {
      startAudio(newChan);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(newVol * 0.12, audioCtxRef.current.currentTime);
    }
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full bg-slate-900/70 rounded-2xl border border-white/10 p-4 backdrop-blur-2xl shadow-xl text-center overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Radio size={13} />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">
            NEURAL AMBIENCE
          </span>
        </div>
        <div className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
          Synthesizer Engine
        </div>
      </div>

      {/* Main Display: Spinning Cyber Vinyl Disc & Live Waves */}
      <div className="flex items-center justify-center gap-6 my-2 w-full">
        {/* Animated Spinning Vinyl Disc */}
        <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-slate-950 border-2 border-white/20 shadow-2xl">
          {/* Groove Rings */}
          <div
            className={`w-full h-full rounded-full border border-dashed border-white/15 flex items-center justify-center ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '4s' }}
          >
            <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"
                style={{
                  backgroundColor: `${currentChannel.color}25`,
                  boxShadow: isPlaying ? `0 0 14px ${currentChannel.color}` : 'none'
                }}
              >
                <Disc3
                  size={20}
                  style={{ color: currentChannel.color }}
                  className={isPlaying ? 'animate-pulse' : ''}
                />
              </div>
            </div>
          </div>

          {/* Needle / Laser Sensor Indicator */}
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white/80"
            style={{
              backgroundColor: isPlaying ? '#06b6d4' : '#64748b',
              boxShadow: isPlaying ? '0 0 8px #06b6d4' : 'none'
            }}
          />
        </div>

        {/* Track Info & Dynamic 16-Bar Audio Waveform */}
        <div className="flex flex-col items-start justify-center text-left">
          <div className="text-sm font-bold text-white tracking-wide">
            {currentChannel.title}
          </div>
          <div className="text-[11px] font-mono text-cyan-400 mb-2">
            {currentChannel.genre}
          </div>

          {/* Real-Time Live Equalizer Bars */}
          <div className="flex items-end gap-1 h-8 px-2 py-1 bg-black/40 rounded-lg border border-white/10">
            {[14, 24, 18, 28, 12, 22, 16, 26, 10, 20, 14, 25, 18, 22].map((h, idx) => (
              <div
                key={idx}
                className="w-1 rounded-full transition-all duration-200"
                style={{
                  height: isPlaying ? `${Math.max(4, (h * (volume + 0.3)))}px` : '4px',
                  backgroundColor: currentChannel.color,
                  opacity: isPlaying ? 0.9 : 0.25,
                  boxShadow: isPlaying ? `0 0 6px ${currentChannel.color}` : 'none'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Station Selector */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 w-full max-w-[340px]">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => handleChannelChange(ch)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-semibold transition ${
              channel === ch.id
                ? 'bg-white/15 text-white shadow-sm border border-white/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {ch.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Bottom Controls: Play/Pause and Volume Slider */}
      <div className="flex items-center justify-between w-full max-w-[340px] mt-2">
        <button
          onClick={togglePlay}
          className={`px-5 py-2 rounded-xl font-bold font-mono text-xs flex items-center gap-2 transition cursor-pointer shadow-lg ${
            isPlaying
              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25'
          }`}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
          <span>{isPlaying ? 'Pause Audio' : 'Start Soundscape'}</span>
        </button>

        {/* Volume Scrubber */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
          {volume === 0 ? (
            <VolumeX size={14} className="text-slate-500" />
          ) : (
            <Volume2 size={14} className="text-cyan-400" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 accent-cyan-400 cursor-pointer h-1"
          />
        </div>
      </div>
    </div>
  );
}
