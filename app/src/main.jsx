import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// In previews/dev, clear stale service-worker caches so code changes appear immediately.
if ('serviceWorker' in navigator) {
  const isPreview = window.location.hostname.includes('preview--') || window.location.hostname.includes('localhost');

  if (import.meta.env.DEV || isPreview) {
    Promise.all([
      navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))),
      'caches' in window ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : Promise.resolve(),
    ]).then(() => {
      if (isPreview && sessionStorage.getItem('beka_cache_refreshed') !== 'true') {
        sessionStorage.setItem('beka_cache_refreshed', 'true');
        window.location.reload();
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('[BEKA] Service worker registered — offline mode active'))
        .catch((err) => console.warn('[BEKA] SW registration failed:', err));
    });
  }
}

// Suppress the automatic browser install prompt on every visit.
// (Stash the event in case we want to trigger install from a custom button later.)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__deferredInstallPrompt = e;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)