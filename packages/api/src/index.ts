// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

export { createConfigHubClient } from './client';
export type { ConfigHubClient, ConfigHubClientOptions } from './client';

// Configuration data lives on its own endpoints and is not JSON. These wrap the calls
// whose defaults would otherwise parse or serialize it as if it were.
export {
  getUnitData,
  getRevisionData,
  getReleaseData,
  putUnitData,
  getUnitMutationSources,
  getRevisionMutationSources,
} from './data';
export type {
  UnitRef,
  RevisionRef,
  ReleaseRef,
  ReadDataOptions,
  ReadDataResult,
  WriteDataOptions,
  WriteDataResult,
  UnitCreateOrUpdateResponse,
  MutationSourcesResponse,
} from './data';

// Input-validation rules (slug, label and annotation patterns and lengths) as the
// server defines them, for validating forms before a request is made.
export * from './validation';

// The full typed surface generated from the pinned OpenAPI spec. Consumers can
// reach for `components['schemas']['Unit']` etc. without re-deriving types.
export type { paths, components, operations } from './schema';
