import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';

// The PWA install prompt handler has been moved to AppContext.tsx
// to be more tightly integrated with the React component lifecycle,
// preventing race conditions.

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