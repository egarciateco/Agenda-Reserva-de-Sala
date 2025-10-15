import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';

// --- Global PWA Install Prompt Handler ---
// By capturing the event here and storing it on the window, we ensure it's
// available for the React app to consume whenever it's ready, avoiding race conditions.
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the default browser prompt from appearing immediately.
  e.preventDefault();
  // Stash the event so it can be triggered later.
  (window as any).deferredInstallPrompt = e;
  // Optionally, dispatch an event to notify the app, but storing it is more robust.
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