import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS middleware for API endpoints
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Serve bundled voices from node_modules
  app.get('/api/voices/:name', (req, res) => {
    const voiceName = req.params.name.replace(/\.bin$/, '');
    const voicePath = path.join(__dirname, 'node_modules', 'kokoro-js', 'voices', `${voiceName}.bin`);

    if (fs.existsSync(voicePath)) {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      fs.createReadStream(voicePath).pipe(res);
    } else {
      res.status(404).json({ error: `Voice ${voiceName} not found` });
    }
  });

  // Proxy Hugging Face model requests with caching and mirrors
  app.get('/api/hf-proxy/*', async (req, res) => {
    try {
      const hfPath = req.params[0];
      
      // If asking for a voice bin file, serve directly from local node_modules
      if (hfPath.includes('voices/') && hfPath.endsWith('.bin')) {
        const voiceFile = path.basename(hfPath);
        const localVoice = path.join(__dirname, 'node_modules', 'kokoro-js', 'voices', voiceFile);
        if (fs.existsSync(localVoice)) {
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return fs.createReadStream(localVoice).pipe(res);
        }
      }

      const mirrors = [
        `https://huggingface.co/${hfPath}`,
        `https://hf-mirror.com/${hfPath}`,
      ];

      let lastError: any = null;
      for (const targetUrl of mirrors) {
        try {
          const fetchRes = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Kokoro-TTS-App/1.0',
            },
          });

          if (fetchRes.ok) {
            res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'application/octet-stream');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            
            const arrayBuffer = await fetchRes.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
          }
        } catch (err) {
          lastError = err;
        }
      }

      res.status(502).json({
        error: 'Failed to fetch from Hugging Face mirrors',
        details: lastError?.message || 'Network unreachable',
        path: hfPath,
      });
    } catch (err: any) {
      console.error('HF Proxy error:', err);
      res.status(500).json({ error: err?.message || 'Proxy internal error' });
    }
  });

  // Server-side Kokoro generation fallback API
  let serverTtsInstance: any = null;
  app.post('/api/tts/generate', async (req, res) => {
    try {
      const { text, voice = 'af_heart', speed = 1.0, dtype = 'q8', blend } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Text prompt is required.' });
      }

      // Lazy initialize server-side KokoroTTS
      if (!serverTtsInstance) {
        const { KokoroTTS } = await import('kokoro-js');
        serverTtsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
          dtype: 'q8',
        });
      }

      let audioData: Float32Array;
      let sampleRate: number = 24000;

      if (blend && blend.enabled && blend.secondaryVoiceId && blend.secondaryVoiceId !== voice) {
        // Dual voice synthesis and harmonic blend
        const [audioPrimary, audioSecondary] = await Promise.all([
          serverTtsInstance.generate(text.trim(), { voice, speed: Number(speed) || 1.0 }),
          serverTtsInstance.generate(text.trim(), { voice: blend.secondaryVoiceId, speed: Number(speed) || 1.0 }),
        ]);

        const pData: Float32Array = audioPrimary.audio;
        const sData: Float32Array = audioSecondary.audio;
        sampleRate = audioPrimary.sampling_rate || 24000;

        const maxLen = Math.max(pData.length, sData.length);
        audioData = new Float32Array(maxLen);
        const wSec = Math.max(0, Math.min(1, Number(blend.blendRatio) || 0.35));
        const wPri = 1 - wSec;

        for (let i = 0; i < maxLen; i++) {
          const p = i < pData.length ? pData[i] : 0;
          const s = i < sData.length ? sData[i] : 0;
          audioData[i] = p * wPri + s * wSec;
        }
      } else {
        const audio = await serverTtsInstance.generate(text.trim(), {
          voice,
          speed: Number(speed) || 1.0,
        });
        audioData = audio.audio;
        sampleRate = audio.sampling_rate || 24000;
      }

      const duration = audioData.length / sampleRate;

      // Convert Float32Array to 16-bit PCM WAV buffer
      const buffer = Buffer.alloc(44 + audioData.length * 2);
      // Write WAV Header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + audioData.length * 2, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16); // PCM Chunk Size
      buffer.writeUInt16LE(1, 20); // Audio Format 1 (PCM)
      buffer.writeUInt16LE(1, 22); // Mono (1 Channel)
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28); // Byte Rate (sampleRate * 1 * 2)
      buffer.writeUInt16LE(2, 32); // Block Align (1 * 2)
      buffer.writeUInt16LE(16, 34); // Bits Per Sample
      buffer.write('data', 36);
      buffer.writeUInt32LE(audioData.length * 2, 40);

      // Write PCM 16-bit samples
      let offset = 44;
      for (let i = 0; i < audioData.length; i++) {
        const s = Math.max(-1, Math.min(1, audioData[i]));
        const val = s < 0 ? s * 0x8000 : s * 0x7fff;
        buffer.writeInt16LE(Math.round(val), offset);
        offset += 2;
      }

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-Audio-Duration', duration.toString());
      res.setHeader('X-Audio-Sample-Rate', sampleRate.toString());
      res.send(buffer);
    } catch (err: any) {
      console.error('Server TTS generation error:', err);
      res.status(500).json({ error: err?.message || 'Server TTS generation failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
