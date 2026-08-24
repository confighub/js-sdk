// Copyright (C) ConfigHub, Inc.
// SPDX-License-Identifier: MIT

import type { ConfigHubClient } from './client';
import type { components } from './schema';

/**
 * Configuration data is not a field of a Unit, a Revision, or a Release. It is read from
 * and written to its own endpoints, which serve the document itself as
 * `application/octet-stream` rather than a JSON envelope around it.
 *
 * These helpers exist because the two defaults of the underlying fetch client are both
 * wrong for that shape, and neither failure is visible to the type checker:
 *
 * - a read is parsed with `response.json()`, which throws on YAML, and
 * - a write is serialized with `JSON.stringify`, which would upload a quoted string.
 *
 * Everything else in the API is ordinary JSON and needs no wrapper — call the client
 * directly. In particular the bulk reads (`/unit_data`, `/revision_data`,
 * `/unit_mutation_sources`, `/revision_mutation_sources`) return JSON arrays, and a list
 * view should use those rather than one request per Unit.
 */

export type UnitCreateOrUpdateResponse = components['schemas']['UnitCreateOrUpdateResponse'];
export type MutationSourcesResponse = components['schemas']['MutationSourcesResponse'];

/** Identifies a Unit. Both ids are required: the data endpoints are Space-scoped. */
export interface UnitRef {
  spaceId: string;
  unitId: string;
}

/** Identifies one Revision of a Unit. */
export interface RevisionRef extends UnitRef {
  revisionId: string;
}

/** Identifies a Release. */
export interface ReleaseRef {
  spaceId: string;
  releaseId: string;
}

export interface ReadDataOptions {
  /**
   * A `DataHash` a previous read served, sent as `If-None-Match`. The server answers 304
   * when the configuration has not changed, which surfaces as `notModified: true` and no
   * `data` — keep what you already had.
   */
  ifNoneMatch?: string;
  signal?: AbortSignal;
}

export interface ReadDataResult {
  /** The configuration, as text. Undefined on a 304 or an error. */
  data?: string;
  /** The `DataHash`, taken from the ETag. Pass it back as `ifNoneMatch` or `ifMatch`. */
  dataHash?: string;
  /** True when the server answered 304 because `ifNoneMatch` still matched. */
  notModified: boolean;
  /** The parsed error body, when the request failed. */
  error?: unknown;
  response: Response;
}

/**
 * Everything describing *how* a configuration should land belongs on the write that
 * carries it, not on a metadata update that precedes it. A metadata call changes no
 * configuration, so each of these has nothing to act on there and is silently dropped —
 * `mergeExternalSource` degrades to a plain overwrite that ignores protected paths, and
 * `dryRun` leaves the metadata call a dry run while this one really writes.
 */
export interface WriteDataOptions {
  /** Description recorded on the Revision this write creates. */
  lastChangeDescription?: string;
  /**
   * Extra parts of the result to return: `'ConfigData'`, `'MutationSources'`, or both,
   * comma-separated. For a `dryRun` nothing is stored, so this is the only way to see what
   * the operation produced. A name that is neither of these nor an expandable field is a 400.
   */
  include?: string;
  /** Compute the result and report it without storing anything. */
  dryRun?: boolean;
  /** Record the paths this write sets as protected local overrides. */
  protect?: boolean;
  /** The classes of guarded reason this write is cleared for, as a JSON Clearance. */
  clearance?: string;
  /** Revision providing the base configuration for a merge. */
  mergeBase?: string;
  /** Merge the body against the Unit as an external source rather than replacing it. */
  mergeExternalSource?: string;
  /** Also subtract the target's local differences from the source patch. */
  mergeEnableSubtraction?: boolean;
  /** Tag id to attach to the head Revision. */
  tag?: string;
  /** ChangeSet the write belongs to. */
  changeSetId?: string;
  /** User-defined category for the Mutation. */
  subgroup?: string;
  /**
   * A `DataHash` a read served, sent as `If-Match`, so the write fails rather than
   * clobbering a configuration somebody else changed in the meantime.
   */
  ifMatch?: string;
  signal?: AbortSignal;
}

export interface WriteDataResult {
  /**
   * The operation's result. The Unit is in its `Unit` field — a write answers with what
   * it did, not with the entity.
   */
  data?: UnitCreateOrUpdateResponse;
  error?: unknown;
  response: Response;
}

// An ETag is the quoted DataHash, optionally weak. Give callers back the hash itself, so
// it can go straight into If-Match / If-None-Match or be compared with Unit.DataHash.
const etagToHash = (response: Response): string | undefined => {
  const etag = response.headers.get('ETag');
  if (!etag) return undefined;
  return etag.replace(/^W\//, '').replace(/^"|"$/g, '');
};

const readData = async (
  call: Promise<{ data?: unknown; error?: unknown; response: Response }>,
): Promise<ReadDataResult> => {
  const { data, error, response } = await call;
  if (response.status === 304) {
    return { notModified: true, dataHash: etagToHash(response), response };
  }
  if (!response.ok) {
    return { notModified: false, error, response };
  }
  // parseAs: 'text' below makes this a string; an empty body is an empty configuration,
  // which is a configuration, so it is not normalized away.
  return { data: (data as string | undefined) ?? '', dataHash: etagToHash(response), notModified: false, response };
};

/** A Unit's configuration, as text. */
export function getUnitData(
  client: ConfigHubClient,
  ref: UnitRef,
  options: ReadDataOptions = {},
): Promise<ReadDataResult> {
  return readData(
    client.GET('/space/{space_id}/unit/{unit_id}/data', {
      params: { path: { space_id: ref.spaceId, unit_id: ref.unitId } },
      headers: options.ifNoneMatch ? { 'If-None-Match': `"${options.ifNoneMatch}"` } : undefined,
      signal: options.signal,
      parseAs: 'text',
    }),
  );
}

/** One Revision's configuration, as text. */
export function getRevisionData(
  client: ConfigHubClient,
  ref: RevisionRef,
  options: ReadDataOptions = {},
): Promise<ReadDataResult> {
  return readData(
    client.GET('/space/{space_id}/unit/{unit_id}/revision/{revision_id}/data', {
      params: {
        path: { space_id: ref.spaceId, unit_id: ref.unitId, revision_id: ref.revisionId },
      },
      headers: options.ifNoneMatch ? { 'If-None-Match': `"${options.ifNoneMatch}"` } : undefined,
      signal: options.signal,
      parseAs: 'text',
    }),
  );
}

/** A Release's bundle. Its ETag is the Release digest rather than a DataHash. */
export function getReleaseData(
  client: ConfigHubClient,
  ref: ReleaseRef,
  options: ReadDataOptions = {},
): Promise<ReadDataResult> {
  return readData(
    client.GET('/space/{space_id}/release/{release_id}/data', {
      params: { path: { space_id: ref.spaceId, release_id: ref.releaseId } },
      headers: options.ifNoneMatch ? { 'If-None-Match': `"${options.ifNoneMatch}"` } : undefined,
      signal: options.signal,
      parseAs: 'text',
    }),
  );
}

/**
 * Replace a Unit's configuration. This is the only way configuration reaches a Unit other
 * than a clone, which copies it server-side: a metadata write has nowhere to put one, and
 * therefore nowhere to lose one.
 *
 * `data` is the document. An empty string is a real configuration — emptying a Unit is how
 * its resources are withdrawn — so never guard this call on the string being non-empty.
 * Track whether a configuration was *supplied* separately from what it contains.
 */
export function putUnitData(
  client: ConfigHubClient,
  ref: UnitRef,
  data: string,
  options: WriteDataOptions = {},
): Promise<WriteDataResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/octet-stream' };
  if (options.ifMatch) headers['If-Match'] = `"${options.ifMatch}"`;

  return client.PUT('/space/{space_id}/unit/{unit_id}/data', {
    params: {
      path: { space_id: ref.spaceId, unit_id: ref.unitId },
      query: {
        last_change_description: options.lastChangeDescription,
        include: options.include,
        dry_run: options.dryRun,
        protect: options.protect,
        clearance: options.clearance,
        merge_base: options.mergeBase,
        merge_external_source: options.mergeExternalSource,
        merge_enable_subtraction: options.mergeEnableSubtraction,
        tag: options.tag,
        change_set_id: options.changeSetId,
        subgroup: options.subgroup,
      },
    },
    headers,
    signal: options.signal,
    body: data,
    // The body is the configuration. The default serializer would JSON.stringify it and
    // upload a quoted string.
    bodySerializer: (body: string | undefined) => body ?? '',
  });
}

/** What set each value in a Unit's configuration. Ordinary JSON. */
export function getUnitMutationSources(client: ConfigHubClient, ref: UnitRef) {
  return client.GET('/space/{space_id}/unit/{unit_id}/mutation_sources', {
    params: { path: { space_id: ref.spaceId, unit_id: ref.unitId } },
  });
}

/** The Revision counterpart of {@link getUnitMutationSources}. */
export function getRevisionMutationSources(client: ConfigHubClient, ref: RevisionRef) {
  return client.GET('/space/{space_id}/unit/{unit_id}/revision/{revision_id}/mutation_sources', {
    params: {
      path: { space_id: ref.spaceId, unit_id: ref.unitId, revision_id: ref.revisionId },
    },
  });
}
