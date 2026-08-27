import React from 'react';
import { Cpu, ShieldCheck, Sparkles, Settings2, DownloadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ModelLoadingState, ModelDtype, DeviceType } from '../types';

interface HeaderProps {
  loadingState: ModelLoadingState;
  dtype: ModelDtype;
  device: DeviceType;
  onOpenSettings: () => void;
  onPreloadModel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  loadingState,
  dtype,
  device,
  onOpenSettings,
  onPreloadModel,
}) => {
  return (
    <header className="border-b border-slate-800/50 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 text-white">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Kokoro TTS
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  82M ONNX
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              100% Client-Side Neural Speech • WebAssembly & Transformers.js
            </p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Privacy badge */}
          <div
            id="badge-privacy-guarantee"
            className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium"
            title="All audio is synthesized directly on your CPU/GPU without sending data to any external server."
          >
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>Zero API Keys • 100% Private</span>
          </div>

          {/* Model Status Badge / Action */}
          {loadingState.status === 'ready' ? (
            <div
              id="badge-model-ready"
              className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400"
            >
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span>ONNX Wasm Active</span>
              <span className="text-slate-400 font-mono text-[11px]">({dtype.toUpperCase()})</span>
            </div>
          ) : loadingState.status === 'loading' ? (
            <div
              id="badge-model-loading"
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono"
            >
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>Loading {loadingState.progress}%</span>
            </div>
          ) : loadingState.status === 'error' ? (
            <div
              id="badge-model-error"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Load Failed</span>
            </div>
          ) : (
            <button
              id="btn-preload-model"
              onClick={onPreloadModel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-medium backdrop-blur-md transition cursor-pointer"
              title="Preload the ONNX model weights into browser cache now"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Pre-load Model</span>
              <span className="sm:hidden">Preload</span>
            </button>
          )}

          {/* Engine Settings Button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition cursor-pointer"
            aria-label="Engine settings"
            title="Model precision & runtime configuration"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
