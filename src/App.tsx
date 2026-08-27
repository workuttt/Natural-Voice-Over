/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Cpu,
  Zap,
  Volume2,
  HardDrive,
  AlertCircle,
  HelpCircle,
  FileAudio,
} from 'lucide-react';
import { VoiceId, ModelDtype, DeviceType, ModelLoadingState, AudioClip } from './types';
import { VOICES_DATA } from './data/voices';
import { PRESET_TEXTS } from './data/presets';
import { kokoroService } from './services/kokoroService';
import { Header } from './components/Header';
import { ModelStatusBar } from './components/ModelStatusBar';
import { VoiceSelector } from './components/VoiceSelector';
import { TextInputArea } from './components/TextInputArea';
import { AudioPlayer } from './components/AudioPlayer';
import { HistoryList } from './components/HistoryList';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [text, setText] = useState<string>(PRESET_TEXTS[0].text);
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoiceId>('af_heart');
  const [speed, setSpeed] = useState<number>(1.0);
  const [dtype, setDtype] = useState<ModelDtype>('q8');
  const [device, setDevice] = useState<DeviceType>('wasm');
  const [streamingMode, setStreamingMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const [loadingState, setLoadingState] = useState<ModelLoadingState>(kokoroService.getState());
  const [activeClip, setActiveClip] = useState<AudioClip | null>(null);
  const [history, setHistory] = useState<AudioClip[]>([]);

  // Subscribe to model state updates
  useEffect(() => {
    const unsubscribe = kokoroService.subscribe((state) => {
      setLoadingState(state);
    });
    return () => unsubscribe();
  }, []);

  // Preload model on user trigger
  const handlePreloadModel = async () => {
    try {
      setErrorToast(null);
      await kokoroService.loadModel(dtype, device);
    } catch (err: any) {
      setErrorToast(err?.message || 'Failed to preload model.');
    }
  };

  // Reload model with updated settings
  const handleReloadModel = async () => {
    try {
      setErrorToast(null);
      await kokoroService.loadModel(dtype, device, true);
      setSettingsOpen(false);
    } catch (err: any) {
      setErrorToast(err?.message || 'Failed to reload model.');
    }
  };

  // Generate speech handler
  const handleGenerate = async () => {
    if (!text.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorToast(null);

    const voiceInfo = VOICES_DATA.find((v) => v.id === selectedVoiceId) || VOICES_DATA[0];

    try {
      const result = await kokoroService.generateSpeech(
        text,
        selectedVoiceId,
        speed,
        dtype,
        device
      );

      const newClip: AudioClip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: text.trim(),
        voiceId: selectedVoiceId,
        voiceName: voiceInfo.name,
        timestamp: Date.now(),
        duration: result.duration,
        blobUrl: result.blobUrl,
        blob: result.blob,
        sampleRate: result.sampleRate,
        speed,
        samplesCount: result.samplesCount,
        waveformData: result.peaks,
      };

      setActiveClip(newClip);
      setHistory((prev) => [newClip, ...prev.slice(0, 19)]); // Keep last 20 clips in session
    } catch (err: any) {
      console.error('Generation failure:', err);
      setErrorToast(err?.message || 'Speech generation failed. Please check browser console or try WASM device.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Select clip from history
  const handleSelectClip = (clip: AudioClip) => {
    setActiveClip(clip);
  };

  // Delete clip from history
  const handleDeleteClip = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (activeClip?.id === id) {
      setActiveClip(null);
    }
  };

  // Clear all history
  const handleClearHistory = () => {
    setHistory([]);
    setActiveClip(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden antialiased">
      {/* Frosted Glass Atmospheric Ambient Background Glow Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[35%] -right-[10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[110px]"></div>
      </div>

      {/* Top Navigation & Status */}
      <Header
        loadingState={loadingState}
        dtype={dtype}
        device={device}
        onOpenSettings={() => setSettingsOpen(true)}
        onPreloadModel={handlePreloadModel}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Model Loading / Status Bar */}
        <ModelStatusBar
          loadingState={loadingState}
          dtype={dtype}
          device={device}
          onRetry={handlePreloadModel}
        />

        {/* Error Toast if synthesis fails */}
        {errorToast && (
          <div
            id="error-toast-card"
            className="rounded-2xl bg-rose-950/60 backdrop-blur-xl border border-rose-800/60 p-4 text-xs text-rose-200 flex items-start justify-between gap-3 shadow-2xl animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-100">Synthesis Error:</span> {errorToast}
              </div>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="text-rose-400 hover:text-rose-100 font-bold px-1.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Text Input & Voice Controls (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Voice Persona Selector */}
            <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-5 sm:p-6 shadow-2xl">
              <VoiceSelector
                selectedVoiceId={selectedVoiceId}
                onSelectVoice={setSelectedVoiceId}
                disabled={isGenerating}
              />
            </div>

            {/* Text Input Area with Presets & Speed Slider */}
            <TextInputArea
              text={text}
              onChangeText={setText}
              speed={speed}
              onChangeSpeed={setSpeed}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              streamingMode={streamingMode}
              onToggleStreaming={setStreamingMode}
            />
          </div>

          {/* Right Column: Audio Player, Waveform & History (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Active Audio Player & WAV Controls */}
            <AudioPlayer clip={activeClip} />

            {/* Session Generation History */}
            <HistoryList
              history={history}
              activeClipId={activeClip?.id || null}
              onSelectClip={handleSelectClip}
              onDeleteClip={handleDeleteClip}
              onClearAll={handleClearHistory}
            />

            {/* Technical Capability Badges */}
            <div className="rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 p-5 shadow-xl space-y-3">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Architecture & Runtime</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/40 backdrop-blur-md border border-slate-700/40">
                  <div className="text-slate-500 text-[11px]">Model Size</div>
                  <div className="font-semibold text-slate-100 font-mono mt-0.5">82M Parameters</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 backdrop-blur-md border border-slate-700/40">
                  <div className="text-slate-500 text-[11px]">Audio Output</div>
                  <div className="font-semibold text-slate-100 font-mono mt-0.5">24 kHz Fidelity</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 backdrop-blur-md border border-slate-700/40">
                  <div className="text-slate-500 text-[11px]">Runtime Engine</div>
                  <div className="font-semibold text-slate-100 font-mono mt-0.5">ONNX Wasm-SIMD</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 backdrop-blur-md border border-slate-700/40">
                  <div className="text-slate-500 text-[11px]">Data Privacy</div>
                  <div className="font-semibold text-emerald-400 text-[11px] mt-0.5">100% In-Browser</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        dtype={dtype}
        onChangeDtype={setDtype}
        device={device}
        onChangeDevice={setDevice}
        onReloadModel={handleReloadModel}
        loadingState={loadingState}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-md py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 uppercase tracking-wider">
            All processing occurs locally in browser via ONNX Runtime
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 uppercase tracking-wider">
            <span>28 Neural Voices</span>
            <span className="text-slate-600">•</span>
            <span>Uncompressed WAV</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium lowercase">zero server costs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
