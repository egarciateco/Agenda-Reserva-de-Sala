import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';

// PWA Install Prompt Handling (as early as possible to avoid race conditions)
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('`beforeinstallprompt` event caught globally.');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  (window as any).deferredInstallPrompt = e;
  // Notify the app that the prompt is ready
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});


// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      // --- PWA Update Logic ---
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // At this point, the updated precached content has been fetched,
                // but the old service worker will still serve the old content
                // until all client tabs are closed. We prompt the user to refresh.
                console.log('New content is available for update.');
                window.dispatchEvent(new CustomEvent('sw-update', { detail: registration }));
              } else {
                // Content is precached for the first time.
                console.log('Content is cached for offline use.');
              }
            }
          };
        }
      };
    }).catch((err: any) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);