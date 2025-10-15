import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';

// --- PWA Install Prompt (Robust Capture) ---
// Capture the event as early as possible and store it globally.
// This prevents race conditions where the event fires before React mounts.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Stash the event so it can be triggered later.
  (window as any).deferredInstallPrompt = e;
  // Notify the app that the install prompt is available.
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
});

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