import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  User,
  ChevronDown,
  Search,
  Check,
  Sparkles,
  Volume2,
  Filter,
  Flame,
  Heart,
  Headphones,
  Globe,
} from 'lucide-react';
import { VoiceId, VoiceInfo } from '../types';
import { VOICES_DATA } from '../data/voices';

interface VoiceSelectorProps {
  selectedVoiceId: VoiceId;
  onSelectVoice: (voiceId: VoiceId) => void;
  disabled?: boolean;
}

type TabCategory = 'all' | 'us_f' | 'us_m' | 'uk_f' | 'uk_m';

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabCategory>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedVoice = useMemo(() => {
    return VOICES_DATA.find((v) => v.id === selectedVoiceId) || VOICES_DATA[0];
  }, [selectedVoiceId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter voices based on tab & search query
  const filteredVoices = useMemo(() => {
    return VOICES_DATA.filter((voice) => {
      // Tab filter
      if (activeTab === 'us_f' && (voice.accent !== 'American' || voice.gender !== 'Female')) return false;
      if (activeTab === 'us_m' && (voice.accent !== 'American' || voice.gender !== 'Male')) return false;
      if (activeTab === 'uk_f' && (voice.accent !== 'British' || voice.gender !== 'Female')) return false;
      if (activeTab === 'uk_m' && (voice.accent !== 'British' || voice.gender !== 'Male')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          voice.name.toLowerCase().includes(q) ||
          voice.id.toLowerCase().includes(q) ||
          voice.description.toLowerCase().includes(q) ||
          voice.accent.toLowerCase().includes(q) ||
          voice.gender.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-cyan-400" />
          Voice Model Persona
        </span>
        <span className="text-[11px] font-normal text-slate-500 normal-case tracking-normal">28 Kokoro Voices</span>
      </label>

      {/* Main Select Button Trigger */}
      <button
        id="dropdown-voice-trigger"
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left rounded-xl border p-3 flex items-center justify-between transition duration-200 cursor-pointer ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-800/30 border-slate-800'
            : isOpen
            ? 'bg-slate-800/60 border-cyan-500/60 ring-2 ring-cyan-500/20 text-white shadow-xl backdrop-blur-md'
            : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/50 hover:border-slate-600/60 text-slate-200 shadow-sm backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 flex items-center justify-center text-base shrink-0">
            {selectedVoice.flag}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white truncate">
                {selectedVoice.name}
              </span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-900/60 text-slate-300 border border-slate-700/60">
                {selectedVoice.id}
              </span>
              {selectedVoice.traits && (
                <span className="text-xs text-cyan-300/90 hidden sm:inline-block">
                  {selectedVoice.traits}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {selectedVoice.accent} {selectedVoice.gender} • Grade {selectedVoice.overallGrade} • {selectedVoice.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-2 shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              selectedVoice.overallGrade.startsWith('A')
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : selectedVoice.overallGrade.startsWith('B')
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Grade {selectedVoice.overallGrade}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          id="dropdown-voice-menu"
          className="absolute z-50 mt-2 w-full max-w-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search voices by name, accent (American/British), traits..."
                className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition"
                autoFocus
              />
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All ({VOICES_DATA.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('us_f')}
                className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'us_f'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🇺🇸 US Female (10)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('us_m')}
                className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'us_m'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🇺🇸 US Male (9)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('uk_f')}
                className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'uk_f'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🇬🇧 UK Female (5)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('uk_m')}
                className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'uk_m'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🇬🇧 UK Male (4)
              </button>
            </div>
          </div>

          {/* Voices List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
            {filteredVoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No voices found matching "{searchQuery}".
              </div>
            ) : (
              filteredVoices.map((voice) => {
                const isSelected = voice.id === selectedVoiceId;
                return (
                  <button
                    key={voice.id}
                    id={`voice-option-${voice.id}`}
                    type="button"
                    onClick={() => {
                      onSelectVoice(voice.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border border-cyan-500/40 text-white'
                        : 'hover:bg-slate-800/60 text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{voice.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">
                            {voice.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            ({voice.id})
                          </span>
                          {voice.traits && (
                            <span className="text-[10px] font-medium text-cyan-300 px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50">
                              {voice.traits}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {voice.accent} {voice.gender} • {voice.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                          voice.overallGrade.startsWith('A')
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : voice.overallGrade.startsWith('B')
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        Grade {voice.overallGrade}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-cyan-500/40">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Voice Recommendation Footer */}
          <div className="p-2.5 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              💡 <strong className="text-slate-300">Top Picks:</strong> af_heart (US Female A), af_bella (US Female A-), bf_emma (UK Female B-), am_adam (US Male)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
