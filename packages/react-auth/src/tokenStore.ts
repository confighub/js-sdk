// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

// A module-level holder for the current minted token, so non-React consumers can read
// it. RTK Query's `prepareHeaders` (in @confighub/rtk-query) is not a hook and cannot
// read React context, so it calls getAccessToken() instead. The provider keeps this in
// sync with its React state.
let currentToken: string | undefined;

/** @internal — called by the provider; not part of the public surface. */
export function setAccessToken(token: string | undefined): void {
  currentToken = token;
}

/**
 * The current minted ConfigHub token, or undefined when unauthenticated. Pass this as
 * the `getToken` for `@confighub/rtk-query`'s `configureConfigHub`, or read it anywhere
 * you need the token outside React.
 */
export function getAccessToken(): string | undefined {
  return currentToken;
}
