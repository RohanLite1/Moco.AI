import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, Radio, Music } from 'lucide-react';

export default function MusicWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [channel, setChannel] = useState('synthwave'); // synthwave | rain | lofi
  const audioCtxRef = useRef(null);
  const oscRef = useRef([]);

  const startAmbientAudio = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Ambient low drones
      const freqs = channel === 'synthwave' ? [110, 164.81, 220] : [80, 120, 160];
      const oscillators = freqs.map(f => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.connect(masterGain);
        osc.start();
        return osc;
      });

      oscRef.current = oscillators;
      setIsPlaying(true);
    } catch (e) {
      console.error('Audio initialization error:', e);
    }
  };

  const stopAmbientAudio = () => {
    oscRef.current.forEach(osc => osc.stop());
    oscRef.current = [];
    audioCtxRef.current?.close();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAmbientAudio();
    } else {
      startAmbientAudio();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900/60 rounded-2xl border border-white/10 p-6 backdrop-blur-xl text-center">
      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
        <Radio size={24} />
      </div>

      <div className="text-base font-semibold text-white mb-1">Ambient Focus Waves</div>
      <div className="text-xs text-slate-400 mb-4 font-mono">Binaural drone synthesizer</div>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setChannel('synthwave')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            channel === 'synthwave' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
          }`}
        >
          Cyber-Zen
        </button>
        <button
          onClick={() => setChannel('lofi')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
            channel === 'lofi' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400'
          }`}
        >
          Deep Focus
        </button>
      </div>

      <button
        onClick={togglePlay}
        className={`px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition ${
          isPlaying
            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
            : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
        }`}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        <span>{isPlaying ? 'Pause Audio' : 'Play Drone Stream'}</span>
      </button>
    </div>
  );
}
