// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

import { createConfigHubClient, type ConfigHubClient } from '@confighub/api';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAutoLoginSuppression,
  clearLoginHint,
  completeLoginFromRedirect,
  hasLoginHint,
  isAutoLoginSuppressed,
  resetPending,
  setLoginHint,
  startLogin,
  startLogout,
  startSilentLogin,
  suppressAutoLogin,
  type MintedSession,
} from './core';
import { setAccessToken } from './tokenStore';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface ConfigHubUser {
  organizationId: string;
  idpClaims: Record<string, unknown>;
}

export interface LogoutOptions {
  /** Also redirect to the IdP end-session endpoint, killing the SSO cookie so the
   *  user must re-enter credentials to log in again (on this browser). */
  endSession?: boolean;
}

export interface ConfigHubAuthContextValue {
  status: AuthStatus;
  user: ConfigHubUser | null;
  error: Error | null;
  /** Begin login: redirects the page to the IdP. */
  login: () => Promise<void>;
  /** Clear the in-memory session and the silent re-auth hint. By default the IdP
   *  SSO cookie survives, so the next login is one non-interactive click; pass
   *  `{ endSession: true }` to end the IdP session too. */
  logout: (options?: LogoutOptions) => void;
  /** Current bearer token, or undefined when unauthenticated. */
  getToken: () => string | undefined;
  /** A typed API client pre-wired with the current token. Stable across renders. */
  client: ConfigHubClient;
}

export const ConfigHubAuthContext = createContext<ConfigHubAuthContextValue | null>(null);

/**
 * For whom a fresh page load attempts a non-interactive (`prompt=none`) login
 * redirect. Tokens are memory-only, so this is what survives a full page refresh.
 *
 * - `'returning'` — only when a prior login is remembered on this browser (the
 *   default: first-time visitors go straight to the login screen).
 * - `'always'` — every fresh load, first-time visitors included. For apps whose
 *   users arrive already holding an IdP session, e.g. reached from a portal that
 *   shares the IdP: they are logged in without ever seeing a login screen.
 * - `'never'` — no automatic attempts; auth starts only from `login()`.
 */
export type SilentReauthMode = 'returning' | 'always' | 'never';

export interface ConfigHubAuthProviderProps {
  /** Absolute base URL of the ConfigHub instance, e.g. `https://hub.confighub.com`. */
  baseUrl: string;
  /** This app's registered OAuth `client_id` (from `cub oauthclient create`). */
  clientId: string;
  /** When to attempt non-interactive login on a fresh load. Default `'returning'`. */
  silentReauth?: SilentReauthMode;
  children: ReactNode;
}

/**
 * Runs the browser-direct auth flow and manages the token lifecycle. On mount it
 * completes a redirect if the page is the IdP callback; on a fresh load it
 * silently re-authenticates via the IdP's SSO cookie when a prior login is
 * remembered (see `silentReauth`); otherwise it starts unauthenticated until
 * `login()` is called.
 */
export function ConfigHubAuthProvider({
  baseUrl,
  clientId,
  silentReauth = 'returning',
  children,
}: ConfigHubAuthProviderProps): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<ConfigHubUser | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // The token lives in a ref so getToken() reads the latest value synchronously
  // without re-creating the API client on every render.
  const tokenRef = useRef<string | undefined>(undefined);
  // The IdP id_token, held for end-session logout (id_token_hint).
  const idTokenRef = useRef<string | undefined>(undefined);

  const applySession = useCallback(
    (session: MintedSession) => {
      tokenRef.current = session.accessToken;
      idTokenRef.current = session.idpIdToken;
      setAccessToken(session.accessToken); // keep the non-React accessor in sync (rtk-query)
      setLoginHint(clientId); // arm silent re-auth for the next full page load
      setUser({ organizationId: session.organizationId, idpClaims: session.idpClaims });
      setError(null);
      setStatus('authenticated');
    },
    [clientId],
  );

  useEffect(() => {
    let cancelled = false;
    completeLoginFromRedirect()
      .then((result) => {
        if (cancelled) return;
        if (result === 'silent-declined') {
          setStatus('unauthenticated');
          return;
        }
        if (result) {
          applySession(result);
          return;
        }
        // Fresh load with no session. Depending on the mode, bounce through the
        // IdP non-interactively; the page navigates away, so stay in 'loading'
        // rather than flashing the login screen. Suppression (this tab logged
        // out, or a silent attempt already failed) always wins.
        const eligible =
          silentReauth === 'always' ||
          (silentReauth === 'returning' && hasLoginHint(clientId));
        if (eligible && !isAutoLoginSuppressed()) {
          startSilentLogin(baseUrl, clientId).catch((e: unknown) => {
            if (cancelled) return;
            console.warn('[confighub-auth] silent re-auth could not start:', e);
            setStatus('unauthenticated');
          });
          return;
        }
        setStatus('unauthenticated');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [applySession, baseUrl, clientId, silentReauth]);

  const login = useCallback(async () => {
    setError(null);
    clearAutoLoginSuppression(); // an explicit login re-arms automatic ones
    try {
      await startLogin(baseUrl, clientId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setStatus('error');
    }
  }, [baseUrl, clientId]);

  const logout = useCallback(
    (options?: LogoutOptions) => {
      const idToken = idTokenRef.current;
      tokenRef.current = undefined;
      idTokenRef.current = undefined;
      setAccessToken(undefined);
      // A refresh after logout must not silently log back in: clear the
      // remembered-login hint, and (for 'always' mode, where no hint is needed)
      // suppress auto-login in this tab until the user logs in explicitly.
      clearLoginHint(clientId);
      suppressAutoLogin();
      resetPending();
      setUser(null);
      setStatus('unauthenticated');
      if (options?.endSession) {
        startLogout(baseUrl, clientId, idToken).catch((e: unknown) => {
          // Local logout already happened; only the IdP SSO cookie survives.
          console.warn('[confighub-auth] IdP end-session failed:', e);
        });
      }
    },
    [baseUrl, clientId],
  );

  const getToken = useCallback(() => tokenRef.current, []);

  // One client for the provider's lifetime. getToken reads tokenRef, and a 401
  // routes back to login() so an expired session re-authenticates.
  const client = useMemo(
    () =>
      createConfigHubClient({
        baseUrl,
        getToken,
        onUnauthorized: () => {
          logout();
        },
      }),
    [baseUrl, getToken, logout],
  );

  const value = useMemo<ConfigHubAuthContextValue>(
    () => ({ status, user, error, login, logout, getToken, client }),
    [status, user, error, login, logout, getToken, client],
  );

  return (
    <ConfigHubAuthContext.Provider value={value}>{children}</ConfigHubAuthContext.Provider>
  );
}
