export type VoiceId =
  | 'af_heart'
  | 'af_bella'
  | 'af_nicole'
  | 'af_sarah'
  | 'af_sky'
  | 'af_alloy'
  | 'af_aoede'
  | 'af_jessica'
  | 'af_kore'
  | 'af_river'
  | 'am_adam'
  | 'am_michael'
  | 'am_echo'
  | 'am_eric'
  | 'am_fenrir'
  | 'am_liam'
  | 'am_onyx'
  | 'am_puck'
  | 'am_santa'
  | 'bf_emma'
  | 'bf_isabella'
  | 'bf_alice'
  | 'bf_lily'
  | 'bm_george'
  | 'bm_fable'
  | 'bm_daniel'
  | 'bm_lewis';

export interface VoiceInfo {
  id: VoiceId;
  name: string;
  language: string; // 'en-us' | 'en-gb'
  accent: 'American' | 'British';
  gender: 'Female' | 'Male';
  traits?: string;
  targetQuality: string;
  overallGrade: string;
  description: string;
  flag: string;
}

export type ModelDtype = 'q8' | 'q4' | 'fp32' | 'fp16';
export type DeviceType = 'wasm' | 'webgpu' | 'cpu';

export interface ProgressItem {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready';
  name?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

export interface ModelLoadingState {
  status: 'unloaded' | 'loading' | 'ready' | 'error';
  progress: number;
  stage: string;
  currentFile: string;
  loadedBytes: number;
  totalBytes: number;
  errorMessage?: string;
  files: Record<string, { loaded: number; total: number; progress: number; name: string }>;
}

export interface VoiceBlendConfig {
  enabled: boolean;
  secondaryVoiceId: VoiceId;
  blendRatio: number; // 0.0 to 1.0 (weight of secondary voice)
}

export type AcousticStylePresetId =
  | 'natural'
  | 'broadcast'
  | 'cinematic'
  | 'whisper'
  | 'energetic'
  | 'vintage_radio';

export interface AcousticStylePreset {
  id: AcousticStylePresetId;
  name: string;
  description: string;
  icon: string;
  pitch: number; // in semitones (-12 to +12)
  bassGain: number; // in dB (-12 to +12)
  trebleGain: number; // in dB (-12 to +12)
  reverbAmount: number; // 0.0 to 1.0
  compression: boolean;
}

export interface VoiceStyleConfig {
  presetId: AcousticStylePresetId;
  pitch: number; // -12 to +12 semitones
  bassGain: number; // -12 to +12 dB
  trebleGain: number; // -12 to +12 dB
  reverbAmount: number; // 0 to 1
  compression: boolean;
  blend: VoiceBlendConfig;
}

export interface AudioClip {
  id: string;
  text: string;
  voiceId: VoiceId;
  voiceName: string;
  timestamp: number;
  duration: number; // in seconds
  blobUrl: string;
  blob: Blob;
  sampleRate: number;
  speed: number;
  samplesCount: number;
  waveformData?: number[]; // normalized peaks 0-1 for fast waveform rendering
  styleConfig?: VoiceStyleConfig;
}

export interface PresetText {
  id: string;
  title: string;
  category: string;
  text: string;
}
