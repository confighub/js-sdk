import { useAuth } from '@confighub/react-auth';
import { SpaceBrowser } from './SpaceBrowser';

export function App() {
  const { status, user, error, login, logout } = useAuth();

  if (status === 'loading') {
    return (
      <div className="card">
        <p className="muted">Signing in…</p>
      </div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <div className="card">
        <h1>ConfigHub Space Browser (RTK Query)</h1>
        <p className="sub">
          The same app as <code>space-browser</code>, but data comes from{' '}
          <code>@confighub/rtk-query</code> hooks instead of the plain client.
        </p>
        <button className="primary" onClick={login}>
          Log in
        </button>
        {error && <pre className="error">{error.message}</pre>}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">ConfigHub Space Browser · RTK Query</span>
        <span className="spacer" />
        <span className="muted">org {user.organizationId}</span>
        <button className="ghost" onClick={() => logout()}>
          Sign out
        </button>
      </header>
      <SpaceBrowser />
    </div>
  );
}
