import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';

// --- Global PWA Install Prompt Handler ---
// By capturing the event here, we avoid race conditions where the event fires 
// before the React component tree is ready to handle it.
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the default browser prompt from appearing.
  e.preventDefault();
  // Dispatch a custom event that the React app can listen for once it's ready.
  const installReadyEvent = new CustomEvent('pwa-install-ready', { detail: e });
  window.dispatchEvent(installReadyEvent);
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