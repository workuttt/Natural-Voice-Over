import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  ClipboardPaste,
  Trash2,
  Gauge,
  Loader2,
  Radio,
  Sliders,
  Type,
  Volume2,
} from 'lucide-react';
import { PRESET_TEXTS } from '../data/presets';
import { PresetText } from '../types';

interface TextInputAreaProps {
  text: string;
  onChangeText: (newText: string) => void;
  speed: number;
  onChangeSpeed: (newSpeed: number) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  streamingMode: boolean;
  onToggleStreaming: (enabled: boolean) => void;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  onChangeText,
  speed,
  onChangeSpeed,
  isGenerating,
  onGenerate,
  streamingMode,
  onToggleStreaming,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  // Approximate duration calculation: ~150 words per minute at 1.0x speed
  const estimatedSeconds = wordCount > 0 ? Math.round((wordCount / 150) * 60 / speed) : 0;

  const handleApplyPreset = (preset: PresetText) => {
    onChangeText(preset.text);
    setSelectedPresetId(preset.id);
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChangeText(clipText);
      }
    } catch {
      // Fallback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && text.trim()) {
        onGenerate();
      }
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Header & Preset Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-cyan-400" />
          <label htmlFor="tts-text-input" className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            Input Text
          </label>
        </div>

        {/* Action buttons (Paste, Clear) */}
        <div className="flex items-center gap-2">
          <button
            id="btn-paste-text"
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 text-xs font-medium transition cursor-pointer backdrop-blur-md"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-cyan-400" />
            <span>Paste</span>
          </button>
          {text && (
            <button
              id="btn-clear-text"
              type="button"
              onClick={() => onChangeText('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/40 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/40 hover:border-rose-800/50 text-xs font-medium transition cursor-pointer backdrop-blur-md"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest shrink-0 mr-1">
          Presets:
        </span>
        {PRESET_TEXTS.map((preset) => (
          <button
            key={preset.id}
            id={`preset-btn-${preset.id}`}
            type="button"
            onClick={() => handleApplyPreset(preset)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer border ${
              selectedPresetId === preset.id
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 border-slate-700/40'
            }`}
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="tts-text-input"
          value={text}
          onChange={(e) => {
            onChangeText(e.target.value);
            setSelectedPresetId('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type or paste your text here to generate high-quality speech..."
          rows={5}
          className="w-full rounded-xl bg-slate-950/50 border border-slate-800/70 p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition leading-relaxed resize-y font-normal backdrop-blur-md"
        />
      </div>

      {/* Textarea Footer (Counters & Estimates) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-slate-200 font-mono">{wordCount}</strong> words
          </span>
          <span className="text-slate-600">•</span>
          <span>
            <strong className="text-slate-200 font-mono">{charCount}</strong> characters
          </span>
          {wordCount > 0 && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-mono font-medium">
                ~{estimatedSeconds}s estimated audio
              </span>
            </>
          )}
        </div>
        <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Enter</kbd> to generate
        </div>
      </div>

      {/* Controls Row: Speed Slider & Synthesis CTA */}
      <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Speed Adjustment */}
        <div className="flex items-center gap-3 bg-slate-800/40 backdrop-blur-md border border-slate-700/40 rounded-xl px-4 py-2.5 flex-1 max-w-sm">
          <Gauge className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="uppercase tracking-wider">Speaking Rate</span>
              <span className="font-mono font-semibold text-cyan-400">{speed.toFixed(2)}x</span>
            </div>
            <input
              id="slider-speech-speed"
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
          {speed !== 1.0 && (
            <button
              id="btn-reset-speed"
              type="button"
              onClick={() => onChangeSpeed(1.0)}
              className="p-1 rounded text-slate-500 hover:text-slate-300 transition cursor-pointer"
              title="Reset to 1.0x"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Generate Primary Button */}
        <button
          id="btn-generate-speech"
          type="button"
          disabled={isGenerating || !text.trim()}
          onClick={onGenerate}
          className={`flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg cursor-pointer shrink-0 ${
            isGenerating
              ? 'bg-slate-800/80 text-cyan-300 border border-cyan-500/30 cursor-wait shadow-cyan-950/20'
              : !text.trim()
              ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/30'
              : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.01] active:scale-[0.99]'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Synthesizing Voice...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Generate Voice</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
