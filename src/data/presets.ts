import { PresetText } from '../types';

export const PRESET_TEXTS: PresetText[] = [
  {
    id: 'intro',
    title: 'Model Intro',
    category: 'Welcome',
    text: 'Hello! I am Kokoro, an open-weight 82-million parameter neural text-to-speech model running entirely inside your web browser via ONNX WebAssembly.',
  },
  {
    id: 'podcast',
    title: 'Podcast Intro',
    category: 'Media',
    text: 'Welcome back to The Deep Dive Podcast. Today, we are exploring how local machine learning models are transforming real-time on-device audio generation.',
  },
  {
    id: 'story',
    title: 'Fantasy Narrative',
    category: 'Storytelling',
    text: 'The ancient gates groaned under the weight of centuries as the traveler stepped into the emerald mist, clutching the glowing amber talisman.',
  },
  {
    id: 'tongue_twister',
    title: 'Phonetics & Twisters',
    category: 'Testing',
    text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood? She sells sea shells by the sea shore on sunny September mornings.',
  },
  {
    id: 'quote',
    title: 'Philosophy Quote',
    category: 'Inspiration',
    text: 'Simplicity is the ultimate sophistication. The art of progress is to preserve order amid change and to preserve change amid order.',
  },
  {
    id: 'tech',
    title: 'Tech Changelog',
    category: 'Technical',
    text: 'Kokoro-82M delivers studio-grade synthesized speech at 24 kilohertz with zero server round trips, guaranteed privacy, and WebAssembly SIMD acceleration.',
  },
];
