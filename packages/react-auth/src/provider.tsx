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
  completeLoginFromRedirect,
  resetPending,
  startLogin,
  type MintedSession,
} from './core';
import { setAccessToken } from './tokenStore';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface ConfigHubUser {
  organizationId: string;
  idpClaims: Record<string, unknown>;
}

export interface ConfigHubAuthContextValue {
  status: AuthStatus;
  user: ConfigHubUser | null;
  error: Error | null;
  /** Begin login: redirects the page to the IdP. */
  login: () => Promise<void>;
  /** Clear the in-memory session. Does not call the IdP end-session endpoint. */
  logout: () => void;
  /** Current bearer token, or undefined when unauthenticated. */
  getToken: () => string | undefined;
  /** A typed API client pre-wired with the current token. Stable across renders. */
  client: ConfigHubClient;
}

export const ConfigHubAuthContext = createContext<ConfigHubAuthContextValue | null>(null);

export interface ConfigHubAuthProviderProps {
  /** Absolute base URL of the ConfigHub instance, e.g. `https://hub.confighub.com`. */
  baseUrl: string;
  /** This app's registered OAuth `client_id` (from `cub oauthclient create`). */
  clientId: string;
  children: ReactNode;
}

/**
 * Runs the browser-direct auth flow and manages the token lifecycle. On mount it
 * completes a redirect if the page is the IdP callback; otherwise it starts
 * unauthenticated until `login()` is called.
 */
export function ConfigHubAuthProvider({
  baseUrl,
  clientId,
  children,
}: ConfigHubAuthProviderProps): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<ConfigHubUser | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // The token lives in a ref so getToken() reads the latest value synchronously
  // without re-creating the API client on every render.
  const tokenRef = useRef<string | undefined>(undefined);

  const applySession = useCallback((session: MintedSession) => {
    tokenRef.current = session.accessToken;
    setAccessToken(session.accessToken); // keep the non-React accessor in sync (rtk-query)
    setUser({ organizationId: session.organizationId, idpClaims: session.idpClaims });
    setError(null);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;
    completeLoginFromRedirect()
      .then((session) => {
        if (cancelled) return;
        if (session) applySession(session);
        else setStatus('unauthenticated');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const login = useCallback(async () => {
    setError(null);
    try {
      await startLogin(baseUrl, clientId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setStatus('error');
    }
  }, [baseUrl, clientId]);

  const logout = useCallback(() => {
    tokenRef.current = undefined;
    setAccessToken(undefined);
    resetPending();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

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
