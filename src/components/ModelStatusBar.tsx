import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, HardDrive, Cpu, Zap, Info } from 'lucide-react';
import { ModelLoadingState, ModelDtype, DeviceType } from '../types';
import { formatBytes } from '../utils/wavHelper';

interface ModelStatusBarProps {
  loadingState: ModelLoadingState;
  dtype: ModelDtype;
  device: DeviceType;
  onRetry: () => void;
}

export const ModelStatusBar: React.FC<ModelStatusBarProps> = ({
  loadingState,
  dtype,
  device,
  onRetry,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // If unloaded, show a subtle informational banner
  if (loadingState.status === 'unloaded') {
    return (
      <div
        id="model-unloaded-card"
        className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">Neural Engine Ready on Demand:</span> Kokoro-82M ({dtype.toUpperCase()}) will automatically load into browser WASM memory on first speech generation.
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            ~85 MB
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            WASM SIMD
          </span>
        </div>
      </div>
    );
  }

  // If error
  if (loadingState.status === 'error') {
    return (
      <div
        id="model-error-card"
        className="rounded-2xl bg-rose-950/30 backdrop-blur-xl border border-rose-800/50 p-4 text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <div className="font-semibold text-rose-100">Failed to Load Neural Model</div>
            <div className="text-rose-300/90 text-[11px] mt-0.5">
              {loadingState.errorMessage || 'Network or browser WASM memory limit encountered.'}
            </div>
          </div>
        </div>
        <button
          id="btn-retry-model"
          onClick={onRetry}
          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition cursor-pointer self-end sm:self-auto shrink-0 shadow-md shadow-rose-900/30"
        >
          Retry Load
        </button>
      </div>
    );
  }

  // If loading or ready
  const filesList: Array<{ loaded: number; total: number; progress: number; name: string }> = Object.values(
    loadingState.files || {}
  );

  return (
    <div
      id="model-status-card"
      className={`rounded-2xl backdrop-blur-xl border transition-all duration-300 p-5 shadow-2xl ${
        loadingState.status === 'loading'
          ? 'bg-slate-900/70 border-cyan-500/40 ring-1 ring-cyan-500/20'
          : 'bg-slate-900/60 border-slate-800/60'
      }`}
    >
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              loadingState.status === 'loading'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {loadingState.status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {loadingState.status === 'loading' ? 'Downloading & Compiling Kokoro-82M' : 'Kokoro-82M ONNX Runtime Active'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-800/80 text-cyan-300 border border-slate-700/60">
                {dtype.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                {device.toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{loadingState.stage}</span>
              {loadingState.status === 'loading' && loadingState.currentFile && (
                <span className="font-mono text-[11px] text-cyan-300 truncate max-w-[200px]">
                  ({loadingState.currentFile})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress percent & file details toggle */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {loadingState.totalBytes > 0 && (
            <span className="font-mono text-xs text-slate-400">
              {formatBytes(loadingState.loadedBytes)} / {formatBytes(loadingState.totalBytes)}
            </span>
          )}
          <span className="font-mono text-sm font-bold text-cyan-400">
            {loadingState.progress}%
          </span>
          {filesList.length > 0 && (
            <button
              id="btn-toggle-model-files"
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              title="Toggle files breakdown"
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Progress Bar */}
      {loadingState.status === 'loading' && (
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-slate-950/60 overflow-hidden relative border border-slate-800/60">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"
              style={{ width: `${Math.max(4, loadingState.progress)}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Downloading ONNX weights from HuggingFace CDN</span>
            <span>Automatically cached in browser storage</span>
          </div>
        </div>
      )}

      {/* Collapsible file list */}
      {showDetails && filesList.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2">
          <div className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Downloaded Neural Components
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filesList.map((f) => (
              <div
                key={f.name}
                className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs flex items-center justify-between gap-2 backdrop-blur-md"
              >
                <div className="truncate text-slate-300 font-mono text-[11px]">{f.name}</div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.total > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatBytes(f.loaded)}
                    </span>
                  )}
                  <span
                    className={`font-mono text-[11px] font-medium ${
                      f.progress >= 100 ? 'text-emerald-400' : 'text-cyan-400'
                    }`}
                  >
                    {f.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
