import { ConfigHubAuthProvider } from '@confighub/react-auth';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

// Config injected at build/start time, like a real SPA: the ConfigHub instance and
// this app's registered client_id. The issuer and OIDC endpoints are discovered at
// runtime from {baseUrl}/api/info, so they are not configured here.
const baseUrl = (import.meta.env.VITE_CONFIGHUB_BASE_URL ?? '').trim();
const clientId = (import.meta.env.VITE_OAUTH_CLIENT_ID ?? '').trim();

const root = createRoot(document.getElementById('root')!);

if (!baseUrl || !clientId) {
  root.render(
    <div className="card">
      <h1>ConfigHub Space Browser</h1>
      <pre className="error">
        Set VITE_CONFIGHUB_BASE_URL and VITE_OAUTH_CLIENT_ID and restart (see README.md).
      </pre>
    </div>,
  );
} else {
  root.render(
    <StrictMode>
      <ConfigHubAuthProvider baseUrl={baseUrl} clientId={clientId}>
        <App />
      </ConfigHubAuthProvider>
    </StrictMode>,
  );
}
