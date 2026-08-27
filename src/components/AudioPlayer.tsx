import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Check,
  Repeat,
  Sparkles,
  Music,
  FileAudio,
} from 'lucide-react';
import { AudioClip } from '../types';
import { formatDuration, downloadBlob } from '../utils/wavHelper';

interface AudioPlayerProps {
  clip: AudioClip | null;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ clip }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync with new clip
  useEffect(() => {
    if (clip && audioRef.current) {
      audioRef.current.src = clip.blobUrl;
      audioRef.current.load();
      setCurrentTime(0);
      setDuration(clip.duration);
      // Auto-play newly generated clip
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Auto-play prevented by browser policy:', err);
          setIsPlaying(false);
        });
    }
  }, [clip]);

  // Handle Audio Event Listeners
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || clip?.duration || 0);
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleDownload = () => {
    if (!clip) return;
    const cleanName = `kokoro-${clip.voiceId}-${new Date(clip.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav`;
    downloadBlob(clip.blob, cleanName);
  };

  const handleCopyText = () => {
    if (!clip) return;
    navigator.clipboard.writeText(clip.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render canvas waveform
  const peaks = useMemo(() => {
    if (clip?.waveformData && clip.waveformData.length > 0) {
      return clip.waveformData;
    }
    // Default peaks
    return Array.from({ length: 70 }, () => 0.15 + Math.random() * 0.4);
  }, [clip]);

  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const numBars = peaks.length;
    const barWidth = width / numBars - 2;

    for (let i = 0; i < numBars; i++) {
      const x = i * (barWidth + 2);
      const barHeight = Math.max(4, peaks[i] * (height - 8));
      const y = (height - barHeight) / 2;

      const isPlayed = i / numBars <= progressRatio;

      if (isPlayed) {
        // Gradient for played bars (cyan to indigo)
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#22d3ee'); // cyan-400
        grad.addColorStop(1, '#6366f1'); // indigo-500
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#334155'; // slate-700
      }

      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(2, barWidth), barHeight, 2);
      ctx.fill();
    }
  }, [peaks, currentTime, duration]);

  if (!clip) {
    return (
      <div
        id="audio-player-empty"
        className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-3 shadow-2xl"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-center text-cyan-400">
          <Music className="w-6 h-6" />
        </div>
        <div>
          <div className="font-semibold text-sm text-slate-200 uppercase tracking-wider">No Audio Generated Yet</div>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Select a voice persona, enter your text, and click Generate Voice to synthesize audio with Kokoro-82M.
          </p>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      id="audio-player-card"
      className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-5 sm:p-6 shadow-2xl space-y-4"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        loop={isLooping}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileAudio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-white">{clip.voiceName}</span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/60">
                {clip.voiceId}
              </span>
              <span className="text-xs text-cyan-400 font-mono">
                {clip.sampleRate / 1000} kHz WAV
              </span>
              {clip.styleConfig?.presetId && clip.styleConfig.presetId !== 'natural' && (
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {clip.styleConfig.presetId.replace('_', ' ')}
                </span>
              )}
              {clip.styleConfig?.pitch !== 0 && clip.styleConfig?.pitch !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {clip.styleConfig.pitch > 0 ? `+${clip.styleConfig.pitch}st` : `${clip.styleConfig.pitch}st`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate max-w-md mt-0.5" title={clip.text}>
              "{clip.text}"
            </p>
          </div>
        </div>

        {/* Action Controls (Download WAV, Copy) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="btn-copy-transcript"
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 text-xs font-medium transition cursor-pointer backdrop-blur-md"
            title="Copy text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          <button
            id="btn-download-wav"
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-cyan-500/20 cursor-pointer"
            title="Download uncompressed 16-bit PCM WAV audio file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>

      {/* Interactive Waveform & Scrubber */}
      <div className="space-y-1.5">
        <div
          id="waveform-container"
          onClick={handleSeek}
          className="relative h-16 w-full rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer overflow-hidden p-2 flex items-center backdrop-blur-md"
        >
          <canvas
            ref={waveformCanvasRef}
            width={600}
            height={56}
            className="w-full h-full block"
          />

          {/* Interactive Playhead Needle with Cyan Glow */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        {/* Time Progress Bar & Timers */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="text-cyan-400 font-semibold">{formatDuration(currentTime)}</span>
          <span className="text-slate-500">{formatDuration(duration || clip.duration)}</span>
        </div>
      </div>

      {/* Primary Player Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {/* Left: Play/Pause, Rewind, Loop */}
        <div className="flex items-center gap-2.5">
          <button
            id="btn-play-pause"
            type="button"
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-white hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            id="btn-replay"
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => setIsPlaying(true));
              }
            }}
            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 backdrop-blur-md transition cursor-pointer"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-toggle-loop"
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2.5 rounded-xl border transition cursor-pointer backdrop-blur-md ${
              isLooping
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border-slate-700/50'
            }`}
            title="Toggle Repeat / Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Middle: Playback Rate Selector */}
        <div className="flex items-center gap-1 bg-slate-800/40 backdrop-blur-md p-1 rounded-xl border border-slate-700/40 text-xs">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-1 rounded-lg font-mono font-medium transition cursor-pointer ${
                playbackRate === rate
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Right: Volume Slider */}
        <div className="flex items-center gap-2 bg-slate-800/40 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/40">
          <button
            id="btn-toggle-mute"
            type="button"
            onClick={toggleMute}
            className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Mute / Unmute"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <input
            id="slider-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 sm:w-20 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
