import React from 'react';
import {
  X,
  Cpu,
  Zap,
  HardDrive,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ModelDtype, DeviceType, ModelLoadingState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dtype: ModelDtype;
  onChangeDtype: (dtype: ModelDtype) => void;
  device: DeviceType;
  onChangeDevice: (device: DeviceType) => void;
  onReloadModel: () => void;
  loadingState: ModelLoadingState;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  dtype,
  onChangeDtype,
  device,
  onChangeDevice,
  onReloadModel,
  loadingState,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        id="modal-settings"
        className="w-full max-w-lg rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Neural Engine Settings</h2>
              <p className="text-xs text-slate-400">
                Kokoro-82M ONNX Runtime Configuration
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Model Precision (Dtype) */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Model Quantization & Precision
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* q8 */}
              <button
                type="button"
                onClick={() => onChangeDtype('q8')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                  dtype === 'q8'
                    ? 'bg-cyan-950/50 border-cyan-500/60 text-white ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">q8 (8-bit)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      Best
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">~85 MB</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Optimal balance of audio fidelity & download speed.
                </div>
              </button>

              {/* q4 */}
              <button
                type="button"
                onClick={() => onChangeDtype('q4')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                  dtype === 'q4'
                    ? 'bg-cyan-950/50 border-cyan-500/60 text-white ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">q4 (4-bit)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      Fast
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">~45 MB</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Lightest download, fastest cold-start on low bandwidth.
                </div>
              </button>

              {/* fp32 */}
              <button
                type="button"
                onClick={() => onChangeDtype('fp32')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                  dtype === 'fp32'
                    ? 'bg-cyan-950/50 border-cyan-500/60 text-white ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">fp32 (Float)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      Studio
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">~330 MB</div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Full floating-point resolution without quantization.
                </div>
              </button>
            </div>
          </div>

          {/* Execution Device */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Hardware Execution Backend
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WebAssembly WASM */}
              <button
                type="button"
                onClick={() => onChangeDevice('wasm')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ${
                  device === 'wasm'
                    ? 'bg-cyan-950/50 border-cyan-500/60 text-white ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>WebAssembly (WASM SIMD)</span>
                  {device === 'wasm' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Runs on CPU via multi-threaded WASM. 100% universal compatibility across all browsers.
                </div>
              </button>

              {/* WebGPU */}
              <button
                type="button"
                onClick={() => onChangeDevice('webgpu')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer backdrop-blur-md ${
                  device === 'webgpu'
                    ? 'bg-cyan-950/50 border-cyan-500/60 text-white ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>WebGPU (Hardware GPU)</span>
                  {device === 'webgpu' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Direct GPU acceleration if supported by your browser & graphics card.
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Cache info */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2 backdrop-blur-md">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Browser Storage & Privacy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Model files are cached inside your browser's persistent Cache Storage. Text is converted into phonemes and synthesized into WAV audio purely inside your local browser memory.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between">
          <button
            type="button"
            onClick={onReloadModel}
            disabled={loadingState.status === 'loading'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Model</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-cyan-500/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
