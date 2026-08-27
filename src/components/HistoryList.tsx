import React from 'react';
import {
  History,
  Play,
  Download,
  Trash2,
  Clock,
  FileAudio,
  Sparkles,
} from 'lucide-react';
import { AudioClip } from '../types';
import { formatDuration, downloadBlob } from '../utils/wavHelper';

interface HistoryListProps {
  history: AudioClip[];
  activeClipId: string | null;
  onSelectClip: (clip: AudioClip) => void;
  onDeleteClip: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  activeClipId,
  onSelectClip,
  onDeleteClip,
  onClearAll,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-5 sm:p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Session Generations ({history.length})
          </h3>
        </div>
        <button
          id="btn-clear-history"
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-rose-400 transition cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-rose-950/30"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* History Items */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {history.map((item) => {
          const isActive = item.id === activeClipId;
          return (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 backdrop-blur-md ${
                isActive
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-white shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800/60 text-slate-300'
              }`}
            >
              {/* Play / Select Button */}
              <button
                type="button"
                onClick={() => onSelectClip(item)}
                className={`p-2.5 rounded-xl transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-cyan-500 hover:text-slate-950'
                }`}
                title="Play this clip in player"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </button>

              {/* Text and Metadata */}
              <div
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => onSelectClip(item)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-xs text-slate-100">
                    {item.voiceName}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-800">
                    {item.voiceId}
                  </span>
                  {item.styleConfig?.presetId && item.styleConfig.presetId !== 'natural' && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.styleConfig.presetId.replace('_', ' ')}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-cyan-400 font-medium">
                    {formatDuration(item.duration)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-1">"{item.text}"</p>
              </div>

              {/* Download WAV & Delete actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const cleanName = `kokoro-${item.voiceId}-${new Date(item.timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.wav`;
                    downloadBlob(item.blob, cleanName);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                  title="Download WAV file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClip(item.id);
                  }}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition cursor-pointer"
                  title="Delete from history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
