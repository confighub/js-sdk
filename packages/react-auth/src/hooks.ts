// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

import type { ConfigHubClient } from '@confighub/api';
import { useContext } from 'react';
import { ConfigHubAuthContext, type ConfigHubAuthContextValue } from './provider';

/**
 * Access the ConfigHub auth state and actions. Must be called under a
 * `<ConfigHubAuthProvider>`.
 *
 * ```ts
 * const { status, user, login, logout } = useAuth();
 * ```
 */
export function useAuth(): ConfigHubAuthContextValue {
  const ctx = useContext(ConfigHubAuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within a <ConfigHubAuthProvider>');
  }
  return ctx;
}

/**
 * The typed ConfigHub API client, pre-wired with the current token. This is the
 * seam between `@confighub/react-auth` and `@confighub/api`: you never pass a
 * token by hand.
 *
 * ```ts
 * const api = useConfigHub();
 * const { data } = await api.GET('/space/{space_id}/unit', { params: { path: { space_id } } });
 * ```
 */
export function useConfigHub(): ConfigHubClient {
  return useAuth().client;
}
