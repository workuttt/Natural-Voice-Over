import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Radio,
  Film,
  Feather,
  Zap,
  Mic,
  RotateCcw,
  Layers,
  Volume2,
  Waves,
  ChevronDown,
  ChevronUp,
  Activity,
  Music2,
} from 'lucide-react';
import { VoiceStyleConfig, AcousticStylePresetId, VoiceId } from '../types';
import { ACOUSTIC_STYLE_PRESETS, DEFAULT_VOICE_STYLE_CONFIG } from '../data/stylePresets';
import { VOICES_DATA } from '../data/voices';

interface VoiceStylingPanelProps {
  primaryVoiceId: VoiceId;
  styleConfig: VoiceStyleConfig;
  onChangeStyleConfig: (config: VoiceStyleConfig) => void;
  disabled?: boolean;
}

export const VoiceStylingPanel: React.FC<VoiceStylingPanelProps> = ({
  primaryVoiceId,
  styleConfig,
  onChangeStyleConfig,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleSelectPreset = (presetId: AcousticStylePresetId) => {
    const preset = ACOUSTIC_STYLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    onChangeStyleConfig({
      ...styleConfig,
      presetId,
      pitch: preset.pitch,
      bassGain: preset.bassGain,
      trebleGain: preset.trebleGain,
      reverbAmount: preset.reverbAmount,
      compression: preset.compression,
    });
  };

  const handleReset = () => {
    onChangeStyleConfig(DEFAULT_VOICE_STYLE_CONFIG);
  };

  const currentPreset = ACOUSTIC_STYLE_PRESETS.find((p) => p.id === styleConfig.presetId) || ACOUSTIC_STYLE_PRESETS[0];
  const secondaryVoice = VOICES_DATA.find((v) => v.id === styleConfig.blend.secondaryVoiceId) || VOICES_DATA[1];

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radio':
        return <Radio className="w-4 h-4" />;
      case 'Film':
        return <Film className="w-4 h-4" />;
      case 'Feather':
        return <Feather className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'Mic':
        return <Mic className="w-4 h-4" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const isCustomized =
    styleConfig.presetId !== 'natural' ||
    styleConfig.pitch !== 0 ||
    styleConfig.bassGain !== 0 ||
    styleConfig.trebleGain !== 0 ||
    styleConfig.reverbAmount !== 0 ||
    styleConfig.compression !== false ||
    styleConfig.blend.enabled;

  return (
    <div
      id="voice-styling-panel"
      className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 shadow-2xl overflow-hidden transition-all duration-200"
    >
      {/* Panel Header & Toggle */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-300 uppercase tracking-widest">
                Voice Styling & Acoustic FX
              </span>
              {styleConfig.blend.enabled && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">
                  Blend Active
                </span>
              )}
              {isCustomized && !styleConfig.blend.enabled && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentPreset.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize tone, spatial room acoustics, EQ, and blend multiple neural personas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustomized && (
            <button
              type="button"
              onClick={handleReset}
              disabled={disabled}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-xs transition cursor-pointer backdrop-blur-md"
              title="Reset all styling to default"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            id="btn-toggle-styling-collapse"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-medium transition cursor-pointer backdrop-blur-md"
          >
            <span>{isExpanded ? 'Hide Controls' : 'Show Studio FX'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Preset Pills Bar (Always Accessible) */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-800/40 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest shrink-0 mr-1">
          Acoustic Presets:
        </span>
        {ACOUSTIC_STYLE_PRESETS.map((preset) => {
          const isSelected = styleConfig.presetId === preset.id;
          return (
            <button
              key={preset.id}
              id={`preset-style-${preset.id}`}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(preset.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/30 to-indigo-600/30 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-800/40 hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 border-slate-700/40'
              }`}
            >
              <span className={isSelected ? 'text-cyan-300' : 'text-slate-500'}>
                {getPresetIcon(preset.icon)}
              </span>
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Collapsible Detailed Controls Studio */}
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-slate-800/60 space-y-5 bg-slate-950/20 animate-in fade-in duration-150">
          {/* Section 1: Voice Blending (Dual Voice Mixing) */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Neural Voice Blending
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Kokoro Signature
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="toggle-voice-blend"
                  type="checkbox"
                  checked={styleConfig.blend.enabled}
                  onChange={(e) =>
                    onChangeStyleConfig({
                      ...styleConfig,
                      blend: {
                        ...styleConfig.blend,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-indigo-600"></div>
              </label>
            </div>

            {styleConfig.blend.enabled ? (
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Secondary Voice Persona
                    </label>
                    <select
                      id="select-secondary-voice"
                      value={styleConfig.blend.secondaryVoiceId}
                      onChange={(e) =>
                        onChangeStyleConfig({
                          ...styleConfig,
                          blend: {
                            ...styleConfig.blend,
                            secondaryVoiceId: e.target.value as VoiceId,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {VOICES_DATA.filter((v) => v.id !== primaryVoiceId).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.flag} {v.name} ({v.id}) - {v.accent} {v.gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Blend Ratio (Secondary Weight)</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {Math.round((1 - styleConfig.blend.blendRatio) * 100)}% /{' '}
                        {Math.round(styleConfig.blend.blendRatio * 100)}%
                      </span>
                    </div>
                    <input
                      id="slider-blend-ratio"
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={styleConfig.blend.blendRatio}
                      onChange={(e) =>
                        onChangeStyleConfig({
                          ...styleConfig,
                          blend: {
                            ...styleConfig.blend,
                            blendRatio: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>Primary: {primaryVoiceId}</span>
                      <span>Secondary: {styleConfig.blend.secondaryVoiceId}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Blend the primary voice with a second persona to generate custom hybrid voices, accents, and unique vocal textures.
              </p>
            )}
          </div>

          {/* Section 2: Acoustic Equalization, Pitch & Dynamics Studio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pitch & Pitch Shifting */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Pitch Offset (Semitones)
                </span>
                <span className="font-mono font-semibold text-cyan-400">
                  {styleConfig.pitch > 0 ? `+${styleConfig.pitch.toFixed(1)}` : styleConfig.pitch.toFixed(1)} st
                </span>
              </div>
              <input
                id="slider-style-pitch"
                type="range"
                min="-6"
                max="6"
                step="0.5"
                value={styleConfig.pitch}
                onChange={(e) =>
                  onChangeStyleConfig({
                    ...styleConfig,
                    pitch: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-6 st (Deep)</span>
                <span>0 (Natural)</span>
                <span>+6 st (High)</span>
              </div>
            </div>

            {/* Reverb & Spatial Ambience */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  Spatial Room Ambience / Reverb
                </span>
                <span className="font-mono font-semibold text-cyan-400">
                  {Math.round(styleConfig.reverbAmount * 100)}%
                </span>
              </div>
              <input
                id="slider-style-reverb"
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                value={styleConfig.reverbAmount}
                onChange={(e) =>
                  onChangeStyleConfig({
                    ...styleConfig,
                    reverbAmount: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% (Dry Studio)</span>
                <span>40% (Auditorium)</span>
                <span>80% (Cathedral)</span>
              </div>
            </div>

            {/* Bass Warmth EQ */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  Low-End Warmth (180 Hz)
                </span>
                <span className="font-mono font-semibold text-cyan-400">
                  {styleConfig.bassGain > 0 ? `+${styleConfig.bassGain.toFixed(1)}` : styleConfig.bassGain.toFixed(1)} dB
                </span>
              </div>
              <input
                id="slider-style-bass"
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={styleConfig.bassGain}
                onChange={(e) =>
                  onChangeStyleConfig({
                    ...styleConfig,
                    bassGain: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-10 dB (Thin)</span>
                <span>0 dB</span>
                <span>+10 dB (Deep Warm)</span>
              </div>
            </div>

            {/* Treble Air EQ */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Treble Clarity & Air (4.8 kHz)
                </span>
                <span className="font-mono font-semibold text-cyan-400">
                  {styleConfig.trebleGain > 0 ? `+${styleConfig.trebleGain.toFixed(1)}` : styleConfig.trebleGain.toFixed(1)} dB
                </span>
              </div>
              <input
                id="slider-style-treble"
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={styleConfig.trebleGain}
                onChange={(e) =>
                  onChangeStyleConfig({
                    ...styleConfig,
                    trebleGain: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-10 dB (Mellow)</span>
                <span>0 dB</span>
                <span>+10 dB (Bright Air)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Compression Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Music2 className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs font-semibold text-white">Broadcast Dynamic Compressor & Limiter</div>
                <p className="text-[11px] text-slate-400">
                  Tightens loudness, boosts vocal punchiness, and protects against distortion.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                id="toggle-mastering-compression"
                type="checkbox"
                checked={styleConfig.compression}
                onChange={(e) =>
                  onChangeStyleConfig({
                    ...styleConfig,
                    compression: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-cyan-500 peer-checked:to-indigo-600"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
