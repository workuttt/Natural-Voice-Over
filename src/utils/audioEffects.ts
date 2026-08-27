import { VoiceStyleConfig } from '../types';
import { encodeWav, extractPeaks } from './wavHelper';

/**
 * Creates a synthetic stereo/mono impulse response for reverb acoustics
 */
function createReverbImpulse(audioCtx: BaseAudioContext, duration: number = 1.2, decay: number = 2.0): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = audioCtx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = i / length;
    // Exponential decay with noise
    const envelope = Math.pow(1 - n, decay);
    left[i] = (Math.random() * 2 - 1) * envelope;
    right[i] = (Math.random() * 2 - 1) * envelope;
  }

  return impulse;
}

/**
 * Applies full acoustic styling (EQ, Reverb, Compression, Pitch) to an AudioBuffer or Float32Array
 */
export async function applyAcousticStyling(
  inputBuffer: AudioBuffer,
  style: VoiceStyleConfig
): Promise<{
  buffer: AudioBuffer;
  blob: Blob;
  blobUrl: string;
  duration: number;
  sampleRate: number;
  samplesCount: number;
  peaks: number[];
}> {
  const sampleRate = inputBuffer.sampleRate;
  const originalDuration = inputBuffer.duration;
  
  // Calculate pitch multiplier (semitones to playback rate factor)
  // 2^(pitch / 12)
  const pitchFactor = Math.pow(2, style.pitch / 12);
  const targetDuration = originalDuration / pitchFactor;
  const targetLength = Math.max(128, Math.floor(targetDuration * sampleRate));

  // If no effects are needed, return quickly
  const hasEQ = Math.abs(style.bassGain) > 0.1 || Math.abs(style.trebleGain) > 0.1;
  const hasReverb = style.reverbAmount > 0.01;
  const hasCompression = style.compression;
  const hasPitch = Math.abs(style.pitch) > 0.05;

  if (!hasEQ && !hasReverb && !hasCompression && !hasPitch) {
    const channelData = inputBuffer.getChannelData(0);
    const blob = encodeWav(channelData, sampleRate);
    return {
      buffer: inputBuffer,
      blob,
      blobUrl: URL.createObjectURL(blob),
      duration: originalDuration,
      sampleRate,
      samplesCount: channelData.length,
      peaks: extractPeaks(channelData, 72),
    };
  }

  // Create Offline Audio Context for deterministic DSP rendering
  const offlineCtx = new OfflineAudioContext(1, targetLength, sampleRate);

  // 1. Source Node
  const source = offlineCtx.createBufferSource();
  source.buffer = inputBuffer;
  source.playbackRate.value = pitchFactor;

  // 2. Low-Shelf EQ (Bass / Warmth)
  const bassFilter = offlineCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 180; // Hz
  bassFilter.gain.value = style.bassGain;

  // 3. High-Shelf EQ (Treble / Air Clarity)
  const trebleFilter = offlineCtx.createBiquadFilter();
  trebleFilter.type = 'highshelf';
  trebleFilter.frequency.value = 4800; // Hz
  trebleFilter.gain.value = style.trebleGain;

  // 4. Presence Filter (Mid Clarity)
  const midFilter = offlineCtx.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.value = 2200;
  midFilter.Q.value = 0.9;
  midFilter.gain.value = style.presetId === 'broadcast' ? 1.5 : style.presetId === 'vintage_radio' ? -6.0 : 0;

  // 5. Vintage Radio Bandpass if selected
  let radioBandpass: BiquadFilterNode | null = null;
  if (style.presetId === 'vintage_radio') {
    radioBandpass = offlineCtx.createBiquadFilter();
    radioBandpass.type = 'bandpass';
    radioBandpass.frequency.value = 1600;
    radioBandpass.Q.value = 1.8;
  }

  // 6. Compressor (Dynamics / Loudness)
  const compressor = offlineCtx.createDynamicsCompressor();
  if (style.compression) {
    compressor.threshold.value = -20;
    compressor.knee.value = 12;
    compressor.ratio.value = 4.5;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
  } else {
    compressor.threshold.value = 0;
    compressor.ratio.value = 1;
  }

  // Connect Main Signal Chain
  source.connect(bassFilter);
  bassFilter.connect(trebleFilter);
  trebleFilter.connect(midFilter);

  let currentEndNode: AudioNode = midFilter;
  if (radioBandpass) {
    midFilter.connect(radioBandpass);
    currentEndNode = radioBandpass;
  }

  currentEndNode.connect(compressor);

  // 7. Spatial Reverb / Room Ambience Wet/Dry Routing
  if (style.reverbAmount > 0.01) {
    const convolver = offlineCtx.createConvolver();
    convolver.buffer = createReverbImpulse(offlineCtx, 1.4, 2.5);

    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();

    dryGain.gain.value = 1.0 - style.reverbAmount * 0.4;
    wetGain.gain.value = style.reverbAmount * 0.8;

    compressor.connect(dryGain);
    compressor.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(offlineCtx.destination);
    wetGain.connect(offlineCtx.destination);
  } else {
    compressor.connect(offlineCtx.destination);
  }

  source.start(0);

  // Render processed buffer
  const renderedBuffer = await offlineCtx.startRendering();
  const renderedChannelData = renderedBuffer.getChannelData(0);

  // Normalize softly to prevent clipping
  let maxAmp = 0;
  for (let i = 0; i < renderedChannelData.length; i++) {
    const abs = Math.abs(renderedChannelData[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  if (maxAmp > 0.98) {
    const scale = 0.98 / maxAmp;
    for (let i = 0; i < renderedChannelData.length; i++) {
      renderedChannelData[i] *= scale;
    }
  }

  const renderedWavBlob = encodeWav(renderedChannelData, sampleRate);
  const blobUrl = URL.createObjectURL(renderedWavBlob);
  const peaks = extractPeaks(renderedChannelData, 72);

  return {
    buffer: renderedBuffer,
    blob: renderedWavBlob,
    blobUrl,
    duration: renderedBuffer.duration,
    sampleRate,
    samplesCount: renderedChannelData.length,
    peaks,
  };
}
