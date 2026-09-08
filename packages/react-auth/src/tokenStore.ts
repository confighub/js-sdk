// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

// A module-level holder for the current minted token, so non-React consumers can read
// it. RTK Query's `prepareHeaders` (in @confighub/rtk-query) is not a hook and cannot
// read React context, so it calls getAccessToken() instead. The provider keeps this in
// sync with its React state, and registers its 401 handling here for the same reason.
import { isExpired } from './core';

let currentToken: string | undefined;
let unauthorizedHandler: (() => void) | undefined;
// Set while a recovery is under way, so a burst of failing requests starts one.
let recovering = false;

/** @internal — called by the provider; not part of the public surface. */
export function setAccessToken(token: string | undefined): void {
  currentToken = token;
  if (token !== undefined) recovering = false;
}

/** @internal — the mounted provider's reaction to a rejected token. */
export function setUnauthorizedHandler(handler: (() => void) | undefined): void {
  unauthorizedHandler = handler;
  recovering = false;
}

/**
 * The current minted ConfigHub token, or undefined when unauthenticated. Pass this as
 * the `getToken` for `@confighub/rtk-query`'s `configureConfigHub`, or read it anywhere
 * you need the token outside React.
 *
 * A token past its `exp` is never handed out: the server would reject it. Instead the
 * provider's recovery starts (a silent re-authentication, or a logout, per its
 * `onUnauthorized`) and the request goes without a token; the page is about to
 * navigate to the IdP and back to where it was.
 */
export function getAccessToken(): string | undefined {
  if (currentToken !== undefined && isExpired(currentToken)) {
    handleUnauthorized();
    return undefined;
  }
  return currentToken;
}

/**
 * Tell the mounted provider the API rejected the token (401). Pass this as the
 * `onUnauthorized` for `@confighub/rtk-query`'s `configureConfigHub` to recover from a
 * token rejected before its expiry, e.g. after a server key rotation; expiry itself is
 * handled by `getAccessToken`. A no-op with no provider mounted, and while a recovery
 * is already under way.
 */
export function handleUnauthorized(): void {
  if (recovering || !unauthorizedHandler) return;
  recovering = true;
  unauthorizedHandler();
}
