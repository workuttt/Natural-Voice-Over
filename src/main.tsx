// Ensure window.fetch has a working setter in environments where it is getter-only
try {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    const nativeFetch = window.fetch.bind(window);
    let currentFetch = nativeFetch;
    Object.defineProperty(window, 'fetch', {
      get: () => currentFetch,
      set: (fn) => {
        currentFetch = typeof fn === 'function' ? fn : nativeFetch;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Silent fallback
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

