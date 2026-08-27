/**
 * Encodes Float32 PCM audio data into a standard 16-bit linear PCM WAV Blob.
 */
export function encodeWav(samples: Float32Array, sampleRate: number = 24000): Blob {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings into DataView
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // chunkSize = 36 + SubChunk2Size
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size for PCM (16 bytes)
  view.setUint16(20, 1, true); // AudioFormat: 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample = 16

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write Float32 samples converted to 16-bit signed PCM integers
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp float value to [-1.0, 1.0]
    const s = Math.max(-1, Math.min(1, samples[i]));
    // Convert to signed 16-bit integer [-32768, 32767]
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Extracts a normalized array of peaks (0 to 1) for waveform visualization.
 */
export function extractPeaks(samples: Float32Array, numBars: number = 64): number[] {
  if (!samples || samples.length === 0) {
    return new Array(numBars).fill(0.1);
  }

  const blockSize = Math.floor(samples.length / numBars);
  const peaks: number[] = [];

  for (let i = 0; i < numBars; i++) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, samples.length);
    let max = 0;

    for (let j = start; j < end; j++) {
      const abs = Math.abs(samples[j]);
      if (abs > max) {
        max = abs;
      }
    }
    // Floor minimum value at 0.08 for visual appeal
    peaks.push(Math.max(0.08, Math.min(1.0, max)));
  }

  return peaks;
}

/**
 * Formats time in seconds to mm:ss format.
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  if (seconds < 10) {
    return `${secs}.${tenths}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats byte size to human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Triggers a browser file download for a given Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
