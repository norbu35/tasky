import * as Sentry from '@sentry/react';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './lib/i18n';
import './styles.css';

// Initialise Sentry before any code that could throw.
// DSN is read from VITE_SENTRY_DSN in the environment.
Sentry.init({
  dsn: import.meta.env['VITE_SENTRY_DSN'],
  tracesSampleRate: 0.0, // Phase 1: errors only
});

// Dev-only: expose testSentry() on window for manual crash-report verification.
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testSentry = () => Sentry.captureException(new Error('Sentry test error'));
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html contains a <div id="root"></div>.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
