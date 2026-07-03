// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

export { createConfigHubClient } from './client';
export type { ConfigHubClient, ConfigHubClientOptions } from './client';

// The full typed surface generated from the pinned OpenAPI spec. Consumers can
// reach for `components['schemas']['Unit']` etc. without re-deriving types.
export type { paths, components, operations } from './schema';
