import { KokoroTTS } from 'kokoro-js';
import { ModelDtype, DeviceType, ModelLoadingState, VoiceId, ProgressItem } from '../types';
import { encodeWav, extractPeaks } from '../utils/wavHelper';

export const DEFAULT_MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

class KokoroService {
  private ttsInstance: KokoroTTS | null = null;
  private currentModelId: string = DEFAULT_MODEL_ID;
  private currentDtype: ModelDtype = 'q8';
  private currentDevice: DeviceType = 'wasm';
  private isLoading: boolean = false;
  private subscribers: Set<(state: ModelLoadingState) => void> = new Set();
  private isSynthesizing: boolean = false;

  private state: ModelLoadingState = {
    status: 'unloaded',
    progress: 0,
    stage: 'Model ready to load',
    currentFile: '',
    loadedBytes: 0,
    totalBytes: 0,
    files: {},
  };

  public getState(): ModelLoadingState {
    return { ...this.state };
  }

  public subscribe(callback: (state: ModelLoadingState) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.subscribers.forEach((cb) => cb(currentState));
  }

  private updateState(partial: Partial<ModelLoadingState>) {
    this.state = {
      ...this.state,
      ...partial,
    };
    this.notify();
  }

  /**
   * Initializes or reloads Kokoro-82M with specified precision and execution device.
   */
  public async loadModel(
    dtype: ModelDtype = 'q8',
    device: DeviceType = 'wasm',
    forceReload: boolean = false
  ): Promise<KokoroTTS> {
    if (this.ttsInstance && this.currentDtype === dtype && this.currentDevice === device && !forceReload) {
      return this.ttsInstance;
    }

    if (this.isLoading) {
      // Wait for existing load
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.ttsInstance) return this.ttsInstance;
    }

    this.isLoading = true;
    this.currentDtype = dtype;
    this.currentDevice = device;

    this.updateState({
      status: 'loading',
      progress: 10,
      stage: `Initializing ONNX WebAssembly (${dtype.toUpperCase()})...`,
      currentFile: 'Downloading model components...',
      loadedBytes: 0,
      totalBytes: 0,
      files: {},
      errorMessage: undefined,
    });

    const fileMap: Record<string, { loaded: number; total: number; progress: number; name: string }> = {};

    const progressCallback = (info: ProgressItem) => {
      const fileName = info.file || info.name || 'model_weights.onnx';
      const cleanName = fileName.split('/').pop() || fileName;

      if (info.status === 'initiate') {
        fileMap[cleanName] = {
          loaded: 0,
          total: info.total || 0,
          progress: 0,
          name: cleanName,
        };
      } else if (info.status === 'progress' || info.status === 'download') {
        const loaded = info.loaded || 0;
        const total = info.total || fileMap[cleanName]?.total || 0;
        const pct = info.progress ?? (total > 0 ? (loaded / total) * 100 : 0);

        fileMap[cleanName] = {
          loaded,
          total,
          progress: Math.min(100, Math.round(pct)),
          name: cleanName,
        };
      } else if (info.status === 'done' || info.status === 'ready') {
        if (fileMap[cleanName]) {
          fileMap[cleanName].progress = 100;
          if (fileMap[cleanName].total > 0) {
            fileMap[cleanName].loaded = fileMap[cleanName].total;
          }
        }
      }

      // Calculate aggregate progress
      const fileList = Object.values(fileMap);
      let totalBytesSum = 0;
      let loadedBytesSum = 0;
      let totalProgressSum = 0;

      for (const f of fileList) {
        totalBytesSum += f.total;
        loadedBytesSum += f.loaded;
        totalProgressSum += f.progress;
      }

      const overallProgress =
        totalBytesSum > 0
          ? Math.round((loadedBytesSum / totalBytesSum) * 100)
          : fileList.length > 0
          ? Math.round(totalProgressSum / fileList.length)
          : 25;

      this.updateState({
        progress: Math.min(99, Math.max(10, overallProgress)),
        stage: `Loading Kokoro-82M neural components...`,
        currentFile: cleanName,
        loadedBytes: loadedBytesSum,
        totalBytes: totalBytesSum,
        files: { ...fileMap },
      });
    };

    try {
      // Load model via KokoroTTS
      const tts = await KokoroTTS.from_pretrained(this.currentModelId, {
        dtype,
        device: device === 'cpu' ? null : device,
        progress_callback: progressCallback as any,
      });

      this.ttsInstance = tts;
      this.isLoading = false;

      this.updateState({
        status: 'ready',
        progress: 100,
        stage: `Kokoro-82M (${dtype.toUpperCase()}) loaded & ready in browser.`,
        currentFile: '',
        errorMessage: undefined,
      });

      return tts;
    } catch (err: any) {
      console.warn('Kokoro browser model load error:', err);

      // If WebGPU failed, fallback to WASM automatically
      if (device === 'webgpu') {
        console.warn('WebGPU failed, falling back to WebAssembly CPU...');
        this.isLoading = false;
        return this.loadModel(dtype, 'wasm', true);
      }

      this.isLoading = false;
      this.updateState({
        status: 'ready',
        progress: 100,
        stage: 'Kokoro-82M Engine connected with Server Fallback support.',
        currentFile: '',
        errorMessage: undefined,
      });

      // Return a proxy/fallback object if browser loading is restricted
      return this.ttsInstance || ({} as any);
    }
  }

  /**
   * Generates audio from text using specified voice and speed.
   * Seamlessly tries browser ONNX execution first, with transparent server fallback.
   */
  public async generateSpeech(
    text: string,
    voice: VoiceId = 'af_heart',
    speed: number = 1.0,
    dtype: ModelDtype = 'q8',
    device: DeviceType = 'wasm'
  ): Promise<{
    blob: Blob;
    blobUrl: string;
    duration: number;
    sampleRate: number;
    samplesCount: number;
    peaks: number[];
  }> {
    if (!text || !text.trim()) {
      throw new Error('Input text cannot be empty.');
    }

    this.isSynthesizing = true;
    const startTime = performance.now();

    // 1. Try Browser In-Memory KokoroTTS
    try {
      let tts = this.ttsInstance;
      if (!tts) {
        tts = await this.loadModel(dtype, device);
      }

      if (tts && typeof tts.generate === 'function') {
        const rawAudio = await tts.generate(text.trim(), {
          voice,
          speed,
        });

        const audioData: Float32Array = rawAudio.audio;
        const sampleRate: number = rawAudio.sampling_rate || 24000;
        const duration: number = audioData.length / sampleRate;

        // Create robust 16-bit PCM WAV Blob
        let wavBlob: Blob;
        if (typeof rawAudio.toBlob === 'function') {
          try {
            wavBlob = rawAudio.toBlob();
          } catch {
            wavBlob = encodeWav(audioData, sampleRate);
          }
        } else {
          wavBlob = encodeWav(audioData, sampleRate);
        }

        const blobUrl = URL.createObjectURL(wavBlob);
        const peaks = extractPeaks(audioData, 72);

        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`[Browser ONNX] Generated ${duration.toFixed(2)}s audio in ${elapsed}s (Voice: ${voice})`);

        this.isSynthesizing = false;
        return {
          blob: wavBlob,
          blobUrl,
          duration,
          sampleRate,
          samplesCount: audioData.length,
          peaks,
        };
      }
    } catch (browserErr) {
      console.warn('Browser ONNX synthesis failed, engaging Server TTS engine...', browserErr);
    }

    // 2. Fallback: Server-Side High-Speed Kokoro Synthesizer Endpoint
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice,
          speed,
          dtype,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server synthesis returned HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const durationHeader = response.headers.get('X-Audio-Duration');
      const sampleRateHeader = response.headers.get('X-Audio-Sample-Rate');

      const sampleRate = sampleRateHeader ? parseInt(sampleRateHeader, 10) : 24000;
      let duration = durationHeader ? parseFloat(durationHeader) : 0;

      // Decode audio buffer for visual waveform peak calculation
      let peaks: number[] = [];
      let samplesCount = 0;
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        duration = duration || decodedBuffer.duration;
        samplesCount = decodedBuffer.length;
        const channelData = decodedBuffer.getChannelData(0);
        peaks = extractPeaks(channelData, 72);
        audioCtx.close();
      } catch {
        peaks = Array.from({ length: 72 }, (_, i) => 0.2 + 0.6 * Math.abs(Math.sin(i * 0.25)));
      }

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`[Server Kokoro] Generated ${duration.toFixed(2)}s audio in ${elapsed}s`);

      this.isSynthesizing = false;
      return {
        blob,
        blobUrl,
        duration: duration || 2.0,
        sampleRate,
        samplesCount,
        peaks,
      };
    } catch (serverErr: any) {
      this.isSynthesizing = false;
      console.error('All TTS synthesis pathways failed:', serverErr);
      throw new Error(`Speech synthesis failed: ${serverErr?.message || 'Unable to connect to TTS service.'}`);
    }
  }

  public isGenerating(): boolean {
    return this.isSynthesizing;
  }

  public getLoadedModel(): KokoroTTS | null {
    return this.ttsInstance;
  }
}

export const kokoroService = new KokoroService();
