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
  OrganizationMissing,
  callbackUri,
  completeLoginFromRedirect,
  endSession,
  isExpired,
  organizationAliasOf,
  rememberOrganization,
  resetPending,
  startLogin,
  switchOrganization as switchOrganizationCore,
  type LoginOptions,
  type MintedSession,
} from './core';
import { setAccessToken } from './tokenStore';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface ConfigHubUser {
  organizationId: string;
  idpClaims: Record<string, unknown>;
}

export interface LogoutOptions {
  /**
   * Also end the IdP session (RP-initiated logout), so the next login asks for
   * credentials instead of riding the SSO cookie. Redirects the page; the landing
   * URI must be registered for the client. Default: false, which only forgets the
   * token in this tab.
   */
  endSession?: boolean;
  /** Where to land after IdP logout. Defaults to the callback URI. */
  postLogoutRedirectUri?: string;
}

export interface ConfigHubAuthContextValue {
  status: AuthStatus;
  user: ConfigHubUser | null;
  error: Error | null;
  /** Begin login: redirects the page to the IdP. */
  login: (options?: LoginOptions) => Promise<void>;
  /** Forget the session in this tab and, optionally, end the IdP session too. */
  logout: (options?: LogoutOptions) => Promise<void>;
  /**
   * Re-mint the ConfigHub token for another organization the user belongs to. The
   * IdP session is untouched. Rejects with the server's error if the user is not a
   * member; the current session stays as it was.
   */
  switchOrganization: (organizationId: string) => Promise<void>;
  /**
   * The ConfigHub token stopped working (a 401). Try to get a new one without any
   * UI: a `prompt=none` round trip through the IdP, for the organization the session
   * already had. Status goes to `loading` meanwhile, not `unauthenticated`, so an
   * app that auto-logs-in on `unauthenticated` does not race this with an
   * interactive login. If the IdP session is gone too, the page comes back
   * `unauthenticated`. Redirects the page.
   */
  reauthenticate: () => Promise<void>;
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
  /**
   * Same-origin path the IdP redirects back to; `{origin}{callbackPath}` is the
   * redirect URI to register. Defaults to `/`. Fixed on purpose: the page a user
   * starts login from travels in the PKCE state, not in the redirect URI.
   */
  callbackPath?: string;
  /**
   * `'session'` keeps the minted token in `sessionStorage` so a reload or an in-tab
   * navigation does not round-trip through the IdP. Tab-scoped and gone when the tab
   * closes. Default `'none'`: memory only, a reload starts unauthenticated.
   */
  persist?: 'none' | 'session';
  /**
   * What a 401 from the API means. `'login'` (default): the token is stale, try a
   * silent re-authentication (`prompt=none`) and fall back to unauthenticated if the
   * IdP session is gone too. `'logout'`: just drop the session.
   */
  onUnauthorized?: 'login' | 'logout';
  children: ReactNode;
}

const SESSION_KEY = 'confighub_session';

function readPersisted(): MintedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: MintedSession = JSON.parse(raw);
    if (!session.accessToken || isExpired(session.accessToken)) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Runs the browser-direct auth flow and manages the token lifecycle. On mount it
 * completes a redirect if the page is the IdP callback, restores a persisted
 * session if there is one, and otherwise starts unauthenticated until `login()`
 * is called.
 */
export function ConfigHubAuthProvider({
  baseUrl,
  clientId,
  callbackPath,
  persist = 'none',
  onUnauthorized = 'login',
  children,
}: ConfigHubAuthProviderProps): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<ConfigHubUser | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // The session lives in a ref so getToken() reads the latest value synchronously
  // without re-creating the API client on every render.
  const sessionRef = useRef<MintedSession | undefined>(undefined);
  const flow = useMemo(() => ({ callbackPath }), [callbackPath]);

  const persistSession = useCallback(
    (session: MintedSession | undefined) => {
      if (persist !== 'session') return;
      try {
        if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        else sessionStorage.removeItem(SESSION_KEY);
      } catch {
        // Storage unavailable (private mode, quota): memory-only for this tab.
      }
    },
    [persist],
  );

  const applySession = useCallback(
    (session: MintedSession) => {
      sessionRef.current = session;
      setAccessToken(session.accessToken); // keep the non-React accessor in sync (rtk-query)
      persistSession(session);
      setUser({ organizationId: session.organizationId, idpClaims: session.idpClaims });
      setError(null);
      setStatus('authenticated');
    },
    [persistSession],
  );

  const clearSession = useCallback(() => {
    sessionRef.current = undefined;
    setAccessToken(undefined);
    persistSession(undefined);
    resetPending();
    setUser(null);
    setStatus('unauthenticated');
  }, [persistSession]);

  useEffect(() => {
    let cancelled = false;
    completeLoginFromRedirect()
      .then((session) => {
        if (cancelled) return;
        if (session) return applySession(session);
        const persisted = persist === 'session' ? readPersisted() : null;
        if (persisted) return applySession(persisted);
        setStatus('unauthenticated');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof OrganizationMissing) {
          // Once, with no hint, flagged so a second miss surfaces as an error.
          void startLogin(
            baseUrl,
            clientId,
            { returnTo: e.returnTo, organization: null },
            flow,
            { retriedForOrganization: true },
          );
          return;
        }
        setError(e instanceof Error ? e : new Error(String(e)));
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [applySession, persist, baseUrl, clientId, flow]);

  const login = useCallback(
    async (options?: LoginOptions) => {
      setError(null);
      try {
        await startLogin(baseUrl, clientId, options, flow);
      } catch (e: unknown) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setStatus('error');
      }
    },
    [baseUrl, clientId, flow],
  );

  const logout = useCallback(
    async (options?: LogoutOptions) => {
      const idToken = sessionRef.current?.idToken;
      clearSession();
      if (options?.endSession) {
        await endSession(
          baseUrl,
          clientId,
          idToken,
          options.postLogoutRedirectUri ?? callbackUri(flow),
        );
      }
    },
    [baseUrl, clientId, clearSession, flow],
  );

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      const current = sessionRef.current;
      if (!current) throw new Error('not authenticated');
      const minted = await switchOrganizationCore(baseUrl, current.accessToken, organizationId);
      // The session's IdP claims still name the previous org, so its alias must not
      // be remembered as the default for the next login.
      rememberOrganization(clientId, undefined);
      applySession({ ...current, ...minted });
    },
    [applySession, baseUrl, clientId],
  );

  const getToken = useCallback(() => sessionRef.current?.accessToken, []);

  const reauthenticate = useCallback(async () => {
    const organization = organizationAliasOf(sessionRef.current?.idpClaims ?? {});
    // Forget the token but stay 'loading': the page is about to navigate away,
    // and 'unauthenticated' would invite an interactive login in the meantime.
    sessionRef.current = undefined;
    setAccessToken(undefined);
    persistSession(undefined);
    resetPending();
    setStatus('loading');
    try {
      await startLogin(baseUrl, clientId, { prompt: 'none', organization }, flow);
    } catch (e: unknown) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setStatus('error');
    }
  }, [baseUrl, clientId, flow, persistSession]);

  // A 401 means the minted token no longer works. Silent re-auth keeps the user's
  // place if the IdP session is still alive; otherwise the page comes back
  // unauthenticated and the app offers a real login.
  const handleUnauthorized = useCallback(() => {
    if (!sessionRef.current) return;
    if (onUnauthorized === 'login') void reauthenticate();
    else clearSession();
  }, [clearSession, reauthenticate, onUnauthorized]);

  // One client for the provider's lifetime. getToken reads the session ref.
  const client = useMemo(
    () => createConfigHubClient({ baseUrl, getToken, onUnauthorized: handleUnauthorized }),
    [baseUrl, getToken, handleUnauthorized],
  );

  const value = useMemo<ConfigHubAuthContextValue>(
    () => ({
      status,
      user,
      error,
      login,
      logout,
      switchOrganization,
      reauthenticate,
      getToken,
      client,
    }),
    [status, user, error, login, logout, switchOrganization, reauthenticate, getToken, client],
  );

  return (
    <ConfigHubAuthContext.Provider value={value}>{children}</ConfigHubAuthContext.Provider>
  );
}
