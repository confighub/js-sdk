import { ConfigHubAuthProvider, getAccessToken } from '@confighub/react-auth';
import { configureConfigHub } from '@confighub/rtk-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from './store';
import './index.css';

const baseUrl = (import.meta.env.VITE_CONFIGHUB_BASE_URL ?? '').trim();
const clientId = (import.meta.env.VITE_OAUTH_CLIENT_ID ?? '').trim();

// Point the RTK Query api at this instance and hand it the token source. The token is
// read per request from @confighub/react-auth's non-React accessor, so login state
// flows into every query with no Redux auth slice of our own.
configureConfigHub({ baseUrl, getToken: getAccessToken });

const root = createRoot(document.getElementById('root')!);

if (!baseUrl || !clientId) {
  root.render(
    <div className="card">
      <h1>ConfigHub Space Browser (RTK Query)</h1>
      <pre className="error">
        Set VITE_CONFIGHUB_BASE_URL and VITE_OAUTH_CLIENT_ID and restart (see README.md).
      </pre>
    </div>,
  );
} else {
  root.render(
    <StrictMode>
      <Provider store={store}>
        <ConfigHubAuthProvider baseUrl={baseUrl} clientId={clientId}>
          <App />
        </ConfigHubAuthProvider>
      </Provider>
    </StrictMode>,
  );
}
