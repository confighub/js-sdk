# Changelog

`@confighub/api`, `@confighub/react-auth` and `@confighub/rtk-query` publish together at one
version; `X.Y` names the ConfigHub API the packages were generated against (see README,
"Versions"). Sections from 0.4.5 on are generated from commit history by
[git-cliff](https://git-cliff.org) at publish time (`cliff.toml`); the same text is the
GitHub release's notes. An "API spec" entry is a re-pin to a new ConfigHub release and
lists what the generated surface gained or lost.

## 0.8.12 — 2026-10-09

### API

Compared with ConfigHub `v0.8.11`:

#### Added (8)

- field `ChangeOrder.PriorRevisions`
- field `ChangeOrder.ReleasePriorRevisions`
- field `ChangeOrder.ReleaseTagID`
- field `ChangeOrder.UserID`
- field `ExtendedChangeOrder.ReleaseTag`
- field `ReleasePublishRequest.DryRun`
- field `ReleasePublishRequest.PriorRevisions`
- field `UnitTagRequest.Move`

## 0.8.11 — 2026-10-09

### API

Compared with ConfigHub `v0.8.10`:

#### Added (1)

- field `Release.SkippedUnits`

## 0.8.10 — 2026-10-08

### Changes

- `@confighub/api`, `@confighub/rtk-query`: `ServiceAccount`, an organization-level identity backed by
  a User, with operations to create, get, list, update, patch and delete service accounts, bulk
  patch and delete them, and register, list and delete their keys (`CreateServiceAccountKey`,
  `ListServiceAccountKeys`, `DeleteServiceAccountKey`). Permissions take a new action category,
  `Impersonate`, which applies only to a ServiceAccount and is required to register or delete its
  keys.

### API

Compared with ConfigHub `v0.8.9`:

#### Added (8)

- path `/_service_account`
- path `/service_account`
- path `/service_account/{service_account_id}`
- path `/service_account/{service_account_id}/key`
- path `/service_account/{service_account_id}/key/{kid}`
- schema `ExtendedServiceAccount`
- schema `ServiceAccount`
- schema `ServiceAccountCreateOrUpdateResponse`

## 0.8.9 — 2026-10-08

### API

Compared with ConfigHub `v0.8.8`:

#### Added (5)

- field `PromoteUnitResult.ConfigData`
- field `UploadRequest.Clearance`
- field `UploadRequest.DryRun`
- field `UploadRequest.Subgroup`
- field `UploadRequest.TagID`

## 0.8.8 — 2026-10-07

### API

Compared with ConfigHub `v0.8.7`:

#### Removed (1), breaking for code typed against them

- parameter `name_prefixes` on `POST /attribute`

#### Added (6)

- parameter `container_images` on `GET /space/{space_id}/change_order/{change_order_id}`
- parameter `variant_labels` on `POST /trigger`
- parameter `name_pattern` on `POST /trigger`
- field `ChangeOrder.ContainerImages`
- schema `ChangeOrderContainerImageChange`
- schema `ChangeOrderSpaceContainerImages`

## 0.8.7 — 2026-10-06

### API

Compared with ConfigHub `v0.8.6`:

The API is unchanged.

## 0.8.6 — 2026-10-06

### API

Compared with ConfigHub `v0.8.5`:

The API is unchanged.

## 0.8.5 — 2026-10-06

### API

Compared with ConfigHub `v0.8.4`:

#### Added (15)

- parameter `from_backing_units` on `DELETE /_component`
- parameter `from_backing_units` on `DELETE /_space`
- parameter `from_backing_units` on `DELETE /attribute`
- parameter `from_backing_units` on `DELETE /change_workflow`
- parameter `from_backing_units` on `DELETE /filter`
- parameter `from_backing_units` on `DELETE /invocation`
- parameter `from_backing_units` on `DELETE /link`
- parameter `from_backing_units` on `DELETE /target`
- parameter `from_backing_units` on `DELETE /trigger`
- parameter `from_backing_units` on `DELETE /view`
- field `UploadComponentRequest.Adopt`
- field `UploadComponentRequest.BackingUnitSpace`
- field `UploadRequest.Partial`
- field `UploadUnitResult.Entity`
- schema `UploadEntityResult`

## 0.8.4 — 2026-10-05

### Changes

- `@confighub/api`, `@confighub/rtk-query`: `publishRelease` of a Space unchanged since its latest
  Release succeeds instead of failing with 400, creating no Release. Its response is now
  `ReleasePublishResponse`, which carries the published `Release`, or, when nothing was
  published, the latest `Release` and a `Message` saying so.

### API

Compared with ConfigHub `v0.8.3`:

#### Removed (4), breaking for code typed against them

- field `ActionResult.ResourceStatuses`
- schema `ResourceStatus`
- schema `ResourceStatusMap`
- field `UnitEvent.ResourceStatuses`

#### Added (18)

- path `/review_comment`
- path `/space/{space_id}/target/{target_id}/document`
- path `/space/{space_id}/unit/{unit_id}/review_comment`
- path `/space/{space_id}/unit/{unit_id}/review_comment/{review_comment_id}`
- parameter `with_backing_units` on `POST /space/{space_id}/target`
- parameter `with_backing_units` on `PATCH /target`
- parameter `from_backing_units` on `PATCH /target`
- parameter `with_backing_units` on `POST /target`
- parameter `from_backing_units` on `POST /target`
- parameter `where_unit` on `POST /target`
- parameter `filter_unit` on `POST /target`
- parameter `patch_existing` on `POST /target`
- field `Target.BackingUnitID`
- field `Target.UpstreamTargetID`
- schema `ExtendedReviewComment`
- schema `ReleasePublishResponse`
- schema `ReviewComment`
- schema `ReviewCommentCreateOrUpdateResponse`

## 0.8.3 — 2026-10-03

### API

Compared with ConfigHub `v0.8.2`:

The API is unchanged.

## 0.8.2 — 2026-10-03

### Changes

- `@confighub/api`, `@confighub/rtk-query`: `Release` has a `LiveStatus` (`ReleaseLiveStatus`), what
  the tool deploying the Release reports about it running: `Reporter`, `DataSource`, normalized
  `Sync`, `Health` and `Operation`, the tool's own words in `ReporterSync`, `ReporterHealth` and
  `ReporterOperation`, `Message`, and `ObservedAt`. It replaces the `confighub.com/live-status`
  Space annotation, which nothing writes or reads any more. EditChildren on a Release's Target
  grants Edit on the Release, which is what writing its `LiveStatus` needs.
- `@confighub/api`, `@confighub/rtk-query`: two requests that used to be accepted are refused
  with 400. `protect` on a merge it would protect against: `upgrade`, `merge_source` other than
  `Self`, `merge_external_source`, a `resolve` of an `UpgradeUnit` or `MergeUnits` Link, and a
  `Promote` without a ChangeOrder or of an `UpgradeUnit` or `MergeUnits` one. And guards that the
  accompanying clearance does not cover, on a Unit update, a function invocation, `Promote`, a
  Trigger, a Link, or a function of a stored Invocation: a write is withheld by guards it is not
  cleared for, its own included.
- `@confighub/api`, `@confighub/rtk-query`: `PromoteRequest` takes the options of a Unit update,
  applied to every Unit write of the promotion: `Protect`, `Clearance`, `Guards` and `Subgroup`,
  and `TagID`, which marks the Revision each written Unit is left at and cannot be used with
  `ChangeOrderID`. It also takes `DryRun`. The `dry_run` query parameter of `Promote` is
  deprecated in favor of it, and is still honored.
- `@confighub/api`, `@confighub/rtk-query`: `ApiInfo` gains an optional `UIURL`, where the
  instance's web UI is served when the instance is configured with it. Absent means the UI,
  if there is one, is on the same host as the API.
- `@confighub/api`, `@confighub/rtk-query`: Targets have a bulk create, `BulkCreateTargets`
  (`POST /target`), which clones the Targets it selects into other Spaces and/or under prefixed
  names, as the other entities' bulk creates do. Each clone lists the Triggers its `WhereTrigger`
  and `TriggerFilterID` select.
- `@confighub/api`, `@confighub/rtk-query`: bulk patch, create and delete take `limit` and
  `continue`. A request that names either acts on at most `limit` entities, in ID order, stops
  early when it runs short of time, and returns `ConfigHub-Continue` when there may be more; send
  the next request with that token until a response has none. A request that names neither acts on
  every entity it selects, as before.
- `@confighub/api`, `@confighub/rtk-query`: every List and Search takes `limit`, `order_by` and
  `continue`, and returns the token for the next page in the `ConfigHub-Continue` response header,
  which the server now exposes to cross-origin pages. Read until a response has no such header: a
  page can hold fewer entities than `limit`, or none, and still be followed by more. Results are
  ordered by the entity's ID after the `order_by` fields. `offset`, on the Revision, UnitEvent and
  Resource lists, is deprecated. The Get operations of those three no longer declare `limit`,
  `offset` and `order_by`, which they never read. `LastActionAt`, which no Unit has, is no longer
  among the Unit attributes `where` accepts.
- `@confighub/api`, `@confighub/rtk-query` (breaking): `WorkerInfo` loses `UseUserIdentity`. The
  server had stopped acting on it, so a worker that set it behaved like one that did not. A
  request that still sends it is accepted and the field is ignored.

### API

Compared with ConfigHub `v0.8.1`:

#### Removed (10), breaking for code typed against them

- parameter `limit` on `GET /space/{space_id}/unit/{unit_id}/resource/{resource_id}`
- parameter `offset` on `GET /space/{space_id}/unit/{unit_id}/resource/{resource_id}`
- parameter `order_by` on `GET /space/{space_id}/unit/{unit_id}/resource/{resource_id}`
- parameter `limit` on `GET /space/{space_id}/unit/{unit_id}/revision/{revision_id}`
- parameter `offset` on `GET /space/{space_id}/unit/{unit_id}/revision/{revision_id}`
- parameter `order_by` on `GET /space/{space_id}/unit/{unit_id}/revision/{revision_id}`
- parameter `limit` on `GET /space/{space_id}/unit/{unit_id}/unit_event/{unit_event_id}`
- parameter `offset` on `GET /space/{space_id}/unit/{unit_id}/unit_event/{unit_event_id}`
- parameter `order_by` on `GET /space/{space_id}/unit/{unit_id}/unit_event/{unit_event_id}`
- field `WorkerInfo.UseUserIdentity`

#### Added (225)

- parameter `limit` on `DELETE /_component`
- parameter `continue` on `DELETE /_component`
- parameter `limit` on `PATCH /_component`
- parameter `continue` on `PATCH /_component`
- parameter `limit` on `DELETE /_space`
- parameter `continue` on `DELETE /_space`
- parameter `limit` on `PATCH /_space`
- parameter `continue` on `PATCH /_space`
- parameter `limit` on `POST /_space`
- parameter `continue` on `POST /_space`
- parameter `limit` on `GET /attestation`
- parameter `order_by` on `GET /attestation`
- parameter `continue` on `GET /attestation`
- parameter `limit` on `DELETE /attribute`
- parameter `continue` on `DELETE /attribute`
- parameter `limit` on `GET /attribute`
- parameter `order_by` on `GET /attribute`
- parameter `continue` on `GET /attribute`
- parameter `limit` on `PATCH /attribute`
- parameter `continue` on `PATCH /attribute`
- parameter `limit` on `POST /attribute`
- parameter `continue` on `POST /attribute`
- parameter `limit` on `DELETE /bridge_worker`
- parameter `continue` on `DELETE /bridge_worker`
- parameter `limit` on `GET /bridge_worker`
- parameter `order_by` on `GET /bridge_worker`
- parameter `continue` on `GET /bridge_worker`
- parameter `limit` on `PATCH /bridge_worker`
- parameter `continue` on `PATCH /bridge_worker`
- parameter `limit` on `GET /bridge_worker/{bridge_worker_id}/queued_operation`
- parameter `order_by` on `GET /bridge_worker/{bridge_worker_id}/queued_operation`
- parameter `continue` on `GET /bridge_worker/{bridge_worker_id}/queued_operation`
- parameter `limit` on `DELETE /change_order`
- parameter `continue` on `DELETE /change_order`
- parameter `limit` on `GET /change_order`
- parameter `order_by` on `GET /change_order`
- parameter `continue` on `GET /change_order`
- parameter `limit` on `PATCH /change_order`
- parameter `continue` on `PATCH /change_order`
- parameter `limit` on `POST /change_order`
- …and 185 more

## 0.8.1 — 2026-10-02

### Changes

- `@confighub/api`, `@confighub/rtk-query`: bulk create of the entities that can have backing Units
  takes `patch_existing`, with `from_backing_units`: a selected Unit that already backs an entity
  patches it with what the Unit holds that the entity has not taken yet, rather than failing.
- `@confighub/api`, `@confighub/rtk-query` (breaking): `Trigger` loses `Params`, as do the
  Trigger patch bodies. It was never part of a Trigger: the field belongs to a function
  invocation made directly, and a Trigger neither stored nor returned it.
- `@confighub/api`, `@confighub/rtk-query` (breaking): five fields only the server sets are now
  marked read-only, which the spec had failed to say: `BridgeWorker.Condition`, `Link.Bindings`,
  `ChangeOrder.ChangeWorkflow`, `Unit.Conflicts` and `Unit.PathAnnotations`. In
  `@confighub/rtk-query` they are on `BridgeWorkerRead`, `LinkRead`, `ChangeOrderRead` and
  `UnitRead` and no longer on the types written; in `@confighub/api` they are `readonly`.
  `Condition` also leaves the BridgeWorker patch bodies.
- `@confighub/api`, `@confighub/rtk-query` (breaking): the records of a ChangeOrder's promotions
  share a shape. `ChangeOrderPromotionFailure.TargetStage` is renamed `Stage`, and is the Stage
  the promotion entered rather than the one the request named; a promotion entering several
  Stages records one entry per Stage. `ChangeOrder` gains `Promotions`, a read-only list of
  `ChangeOrderPromotion` (`UserID`, `PromotedAt`, `Stage`, `SpaceIDs`), one for each promotion
  that wrote the change into Spaces. `ChangeOrderPromotionOverride` gains `SpaceIDs`, and
  `ChangeOrderPromotionFailureSpace` gains `Links`, the Links whose write failed.

### API

Compared with ConfigHub `v0.8.0`:

#### Removed (2), breaking for code typed against them

- field `ChangeOrderPromotionFailure.TargetStage`
- field `Trigger.Params`

#### Added (19)

- path `/group/{group_id}/user/{user_id}`
- parameter `patch_existing` on `POST /_space`
- parameter `patch_existing` on `POST /attribute`
- parameter `patch_existing` on `POST /change_workflow`
- parameter `patch_existing` on `POST /filter`
- parameter `filter` on `GET /group`
- parameter `select` on `GET /group`
- parameter `select` on `GET /group/{group_id}`
- parameter `patch_existing` on `POST /invocation`
- parameter `patch_existing` on `POST /link`
- parameter `patch_existing` on `POST /trigger`
- parameter `patch_existing` on `POST /view`
- field `ChangeOrder.Promotions`
- field `ChangeOrderPromotionFailure.Stage`
- field `ChangeOrderPromotionFailureSpace.Links`
- field `ChangeOrderPromotionOverride.SpaceIDs`
- field `Release.UserID`
- schema `ChangeOrderPromotion`
- schema `ChangeOrderPromotionFailureLink`

## 0.8.0 — 2026-10-01

### Changes

- `@confighub/api`, `@confighub/rtk-query` (breaking): a Link's bindings are split by who makes
  them. `ManualBindings` holds the ones stated by hand, which resolution uses as they are,
  including an Insert Link's one binding; `Bindings` holds the ones resolution finds, and is now
  read-only. `Binding` loses `AutoUpdate`, since the list a Binding is in says which kind it is,
  and gains an optional `Key`, as do the entries of `DownstreamPaths` and `DownstreamSetters`,
  so that a merge matches entries by Key rather than by position.
- `@confighub/api`, `@confighub/rtk-query` (breaking): Get and List of an Organization, an
  OrganizationMember and a User return the entity in an envelope, as every other entity's do:
  `ExtendedOrganization`, `ExtendedOrganizationMember` and `ExtendedUser`, with the entity in
  `.Organization`, `.OrganizationMember` and `.User`. `GET /me` still returns a bare
  `OrganizationMember`, and Create and Update still return the bare entity.
- `@confighub/api`, `@confighub/rtk-query`: Get and List of a User take `select`.

### API

Compared with ConfigHub `v0.7.0`:

#### Removed (1), breaking for code typed against them

- field `Binding.AutoUpdate`

#### Added (15)

- path `/group`
- path `/group/{group_id}`
- parameter `select` on `GET /user`
- parameter `select` on `GET /user/{user_id}`
- field `Binding.Key`
- field `Link.ManualBindings`
- field `ParameterizedFunction.Key`
- field `PathExpression.Key`
- field `Subjects.GroupIDs`
- field `User.GroupIDs`
- schema `ExtendedGroup`
- schema `ExtendedOrganization`
- schema `ExtendedOrganizationMember`
- schema `ExtendedUser`
- schema `Group`

## 0.7.0 — 2026-09-30

### Changes

- `@confighub/api`, `@confighub/rtk-query` (breaking): a Target no longer names a worker, a
  provider or a toolchain. `Target` loses `BridgeWorkerID`, `BridgeHandle`, `ToolchainType`,
  `ProviderType`, `LiveStateType`, `ConfigTypes`, `Options` and `Parameters`, and
  `TargetConfigType` is gone; `ExtendedTarget` loses `BridgeWorker`. `Unit` loses
  `TargetOptions` and `BridgeWorkerID`, and `ExtendedUnit` loses `BridgeWorker`.
  `WorkerInfo` loses `BridgeWorkerInfo`, along with `SupportedConfigType`, `ConfigType` and
  `BridgeOption`. `ExtendedBridgeWorker` loses `TargetCount`, and `ExtendedSpace`'s
  `TargetCountByToolchainType` is replaced by `TotalTargetCount`. Listing functions takes
  `entity=worker` only. A worker is given access to a Target by granting its bot user View and
  ViewChildren in the Target's `Permissions`.

### API

Compared with ConfigHub `v0.6.9`:

#### Removed (20), breaking for code typed against them

- schema `BridgeOption`
- schema `BridgeWorkerInfo`
- field `ExtendedBridgeWorker.TargetCount`
- field `ExtendedSpace.TargetCountByToolchainType`
- field `ExtendedTarget.BridgeWorker`
- field `ExtendedUnit.BridgeWorker`
- schema `SupportedConfigType`
- field `Target.BridgeHandle`
- field `Target.BridgeWorkerID`
- field `Target.ConfigTypes`
- field `Target.LiveStateType`
- field `Target.Options`
- field `Target.Parameters`
- field `Target.ProviderType`
- field `Target.ToolchainType`
- schema `TargetConfigType`
- schema `TargetType2`
- field `Unit.BridgeWorkerID`
- field `Unit.TargetOptions`
- field `WorkerInfo.BridgeWorkerInfo`

#### Added (1)

- field `ExtendedSpace.TotalTargetCount`

## 0.6.9 — 2026-09-30

### Changes

- `@confighub/api`, `@confighub/rtk-query`: List and Search responses, and bulk operations,
  leave out hidden entities, those with a `HiddenReason`, unless `include_hidden` names the
  reason or is `*`, or the `where` clause names the entities by Slug or ID. A Filter's
  `IncludeHidden` adds to `include_hidden` where the Filter is applied. ConfigHub/YAML Units, which hold
  other entities' configuration, are hidden with the reason `BackingUnit`.

### API

Compared with ConfigHub `v0.6.8`:

#### Added (309)

- path `/component/{component_id}/document`
- path `/space/{space_id}/attribute/{attribute_id}/document`
- path `/space/{space_id}/change_workflow/{change_workflow_id}/document`
- path `/space/{space_id}/document`
- path `/space/{space_id}/filter/{filter_id}/document`
- path `/space/{space_id}/invocation/{invocation_id}/document`
- path `/space/{space_id}/link/{link_id}/document`
- path `/space/{space_id}/trigger/{trigger_id}/document`
- path `/space/{space_id}/view/{view_id}/document`
- path `/trigger/move`
- parameter `include_hidden` on `DELETE /_component`
- parameter `include_hidden` on `PATCH /_component`
- parameter `with_backing_units` on `PATCH /_component`
- parameter `backing_unit_space` on `PATCH /_component`
- parameter `from_backing_units` on `PATCH /_component`
- parameter `dry_run` on `PATCH /_component`
- parameter `include_hidden` on `DELETE /_space`
- parameter `include_hidden` on `PATCH /_space`
- parameter `with_backing_units` on `PATCH /_space`
- parameter `backing_unit_space` on `PATCH /_space`
- parameter `from_backing_units` on `PATCH /_space`
- parameter `dry_run` on `PATCH /_space`
- parameter `include_hidden` on `POST /_space`
- parameter `with_backing_units` on `POST /_space`
- parameter `backing_unit_space` on `POST /_space`
- parameter `from_backing_units` on `POST /_space`
- parameter `where_unit` on `POST /_space`
- parameter `filter_unit` on `POST /_space`
- parameter `dry_run` on `POST /_space`
- parameter `include_hidden` on `GET /attestation`
- parameter `include_hidden` on `DELETE /attribute`
- parameter `include_hidden` on `GET /attribute`
- parameter `include_hidden` on `PATCH /attribute`
- parameter `with_backing_units` on `PATCH /attribute`
- parameter `from_backing_units` on `PATCH /attribute`
- parameter `dry_run` on `PATCH /attribute`
- parameter `include_hidden` on `POST /attribute`
- parameter `with_backing_units` on `POST /attribute`
- parameter `from_backing_units` on `POST /attribute`
- parameter `where_unit` on `POST /attribute`
- …and 269 more

## 0.6.8 — 2026-09-29

### API

Compared with ConfigHub `v0.6.7`:

#### Added (19)

- path `/diff`
- path `/space/{space_id}/unit/{unit_id}/diff`
- path `/unit_diff`
- field `DemoteUnitResult.Diff`
- field `FunctionInvocationsResponse.Diff`
- field `PromoteUnitResult.Diff`
- field `UnitConflictsResponse.Diff`
- field `UnitCreateOrUpdateResponse.Diff`
- field `UploadUnitResult.Diff`
- schema `ConfigDiff`
- schema `DiffRequest`
- schema `DiffResult`
- schema `DiffSide`
- schema `DiffSideResult`
- schema `MergeKeyValue`
- schema `PathChange`
- schema `PathSegment`
- schema `ResourceDiff`
- schema `UnitDiff`

## 0.6.7 — 2026-09-29

### API

Compared with ConfigHub `v0.6.6`:

The API is unchanged.

## 0.6.6 — 2026-09-29

### API

Compared with ConfigHub `v0.6.5`:

#### Added (15)

- path `/demote`
- parameter `prior_revisions` on `PATCH /space/{space_id}/unit/{unit_id}`
- parameter `prior_revisions` on `PUT /space/{space_id}/unit/{unit_id}`
- parameter `prior_revisions` on `PATCH /unit`
- field `ChangeOrder.PromotionFailures`
- field `PromoteRequest.PriorRevisions`
- field `PromoteUnitResult.HeadRevisionNum`
- field `PromoteUnitResult.LinkIDs`
- schema `ChangeOrderPromotionFailure`
- schema `ChangeOrderPromotionFailureSpace`
- schema `ChangeOrderPromotionFailureUnit`
- schema `DemoteRequest`
- schema `DemoteResult`
- schema `DemoteSpaceResult`
- schema `DemoteUnitResult`

## 0.6.5 — 2026-09-25

### API

Compared with ConfigHub `v0.6.4`:

The API is unchanged.

## 0.6.4 — 2026-09-25

### API

Compared with ConfigHub `v0.6.3`:

The API is unchanged.

## 0.6.3 — 2026-09-25

### Changes

- `@confighub/rtk-query`: `configureConfigHub({ onForbidden })` is called with the error on
  a 403, next to `onUnauthorized` for a 401.

### API

Compared with ConfigHub `v0.6.2`:

The API is unchanged.

## 0.6.2 — 2026-09-25

### API

Compared with ConfigHub `v0.6.1`:

The API is unchanged.

## 0.6.1 — 2026-09-25

### Changes

- All three packages are now published from the ConfigHub server's repository, at the
  server's version, on every ConfigHub release.
- `@confighub/react-auth`: `signInWithTicket(ticket)` signs a browser in with a ticket from
  `cub auth browser-session`, for an instance with no identity provider; `login()` there
  rejects with the new `NoIdentityProvider`, and `reauthenticate()` goes to
  `unauthenticated`.
- `@confighub/react-auth`: a logout that ends the IdP session keeps status `loading` until
  the page has navigated away, so an app that logs in on `unauthenticated` no longer
  starts a login that races the logout.
- `@confighub/react-auth`: `login({ prompt: 'create' })` opens the identity provider's
  registration form.
- `@confighub/react-auth` (breaking): `switchOrganization()` is removed; it called a server
  endpoint that does not exist. Switch organization with `login({ organization })`.

### API

Compared with ConfigHub `v0.6.0`:

#### Removed (2), breaking for code typed against them

- field `ApiInfo.AuthServer`
- field `ApiInfo.RedirectURI`

## 0.5.4 — 2026-09-25

### API spec

- ConfigHub v0.5.7
  Re-pinned the ConfigHub spec from `v0.5.6` to `v0.5.7` and regenerated both clients.

  **Added (19) — backward compatible**

  - path `/attest`
  - path `/attestation`
  - path `/space/{space_id}/attestation`
  - path `/space/{space_id}/attestation/{attestation_id}`
  - field `ChangeWorkflow.AttestationPrerequisites`
  - field `ChangeWorkflowSpec.AttestationPrerequisites`
  - field `ChangeWorkflowStage.ReleasePrerequisites`
  - field `ExtendedRevision.Attestations`
  - field `Revision.Attestations`
  - schema `AttestRequest`
  - schema `AttestResult`
  - schema `AttestSpaceResult`
  - schema `Attestation`
  - schema `AttestationCreateRequest`
  - schema `AttestationCreateResponse`
  - schema `AttestationSkippedUnit`
  - schema `AttestationSubject`
  - schema `ChangeWorkflowAttestationPrerequisite`
  - schema `ExtendedAttestation`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.5.3 — 2026-09-24

### API spec

- ConfigHub v0.5.6
  Re-pinned the ConfigHub spec from `v0.5.5` to `v0.5.6` and regenerated both clients.

  **Added (23) — backward compatible**

  - path `/_component`
  - path `/attribute/move`
  - path `/change_set/move`
  - path `/change_workflow/move`
  - path `/component`
  - path `/component/{component_id}`
  - path `/filter/move`
  - path `/invocation/move`
  - path `/tag/move`
  - path `/target/move`
  - path `/view/move`
  - field `ChangeOrder.Stage`
  - field `Release.ChangeOrderID`
  - field `ReleasePublishRequest.ChangeOrderID`
  - field `Revision.ValidationTriggerIDs`
  - field `Revision.ValueTriggerIDs`
  - field `Unit.ValidationTriggerIDs`
  - field `Unit.ValueTriggerIDs`
  - schema `Component`
  - schema `ComponentCreateOrUpdateResponse`
  - schema `ExtendedComponent`
  - schema `MoveRequest`
  - schema `MoveResponse`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.5.2 — 2026-09-24

### API spec

- ConfigHub v0.5.5
  Re-pinned the ConfigHub spec from `v0.5.4` to `v0.5.5` and regenerated both clients.

  **Added (16) — backward compatible**

  - parameter `detach` on `DELETE /_space`
  - parameter `detach` on `DELETE /bridge_worker`
  - parameter `detach` on `DELETE /change_order`
  - parameter `detach` on `DELETE /change_set`
  - parameter `detach` on `DELETE /space/{space_id}`
  - parameter `detach` on `DELETE /space/{space_id}/bridge_worker/{bridge_worker_id}`
  - parameter `detach` on `DELETE /space/{space_id}/change_order/{change_order_id}`
  - parameter `detach` on `DELETE /space/{space_id}/change_set/{change_set_id}`
  - parameter `detach` on `DELETE /space/{space_id}/release/{release_id}`
  - parameter `detach` on `DELETE /space/{space_id}/tag/{tag_id}`
  - parameter `detach` on `DELETE /space/{space_id}/target/{target_id}`
  - parameter `detach` on `DELETE /space/{space_id}/unit/{unit_id}`
  - parameter `detach` on `DELETE /tag`
  - parameter `detach` on `DELETE /target`
  - parameter `detach` on `DELETE /unit`
  - field `Tag.ReleaseID`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.5.1 — 2026-09-22

### API spec

- pin ConfigHub v0.5.1, generated clients unchanged
- pin ConfigHub v0.5.2, generated clients unchanged
- pin ConfigHub v0.5.3, generated clients unchanged
- pin ConfigHub v0.5.2, generated clients unchanged
- pin ConfigHub v0.5.3, generated clients unchanged
- ConfigHub v0.5.4
  Re-pinned the ConfigHub spec from `v0.5.3` to `v0.5.4` and regenerated both clients.

  **Added (3) — backward compatible**

  - path `/unit/move`
  - schema `UnitMoveRequest`
  - schema `UnitMoveResponse`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.5.0 — 2026-09-16

### API spec

- pin ConfigHub v0.4.25, generated clients unchanged
- ConfigHub v0.5.0
  Re-pinned the ConfigHub spec from `v0.4.25` to `v0.5.0` and regenerated both clients.

  **Removed (2) — breaking for anyone typed against the old spec**

  - field `Release.BridgeWorkerID`
  - field `Space.ReleaseBridgeWorkerID`

  Release this as a **minor** bump of the js-sdk packages, and check the hand-written
  code (`packages/*/src`, excluding the generated `schema.d.ts` and `confighubApi.gen.ts`)
  for anything that referenced these.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.18 — 2026-09-16

### API spec

- ConfigHub v0.4.24
  Re-pinned the ConfigHub spec from `v0.4.23` to `v0.4.24` and regenerated both clients.

  **Added (7) — backward compatible**

  - parameter `refresh_spaces` on `PATCH /change_order`
  - parameter `refresh_spaces` on `PATCH /space/{space_id}/change_order/{change_order_id}`
  - parameter `refresh_spaces` on `PUT /space/{space_id}/change_order/{change_order_id}`
  - field `ChangeOrder.SpaceFilterID`
  - field `ChangeOrder.WhereSpace`
  - field `ExtendedChangeOrder.SpaceFilter`
  - field `Release.TargetID`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.17 — 2026-09-15

### API spec

- pin ConfigHub v0.4.22, generated clients unchanged
- ConfigHub v0.4.23
  Re-pinned the ConfigHub spec from `v0.4.22` to `v0.4.23` and regenerated both clients.

  **Added (10) — backward compatible**

  - path `/promote`
  - field `ChangeOrder.PromotionOverrides`
  - schema `ChangeOrderPromotionOverride`
  - schema `PromoteGateResult`
  - schema `PromoteLinkResult`
  - schema `PromoteRequest`
  - schema `PromoteResult`
  - schema `PromoteSpaceResult`
  - schema `PromoteStageResult`
  - schema `PromoteUnitResult`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.16 — 2026-09-14

### API spec

- ConfigHub v0.4.21
  Re-pinned the ConfigHub spec from `v0.4.19` to `v0.4.21` and regenerated both clients.

  **Added (7) — backward compatible**

  - field `UploadResult.SourceDigest`
  - field `UploadSourceInfo.Credentials`
  - field `UploadSourceInfo.Pull`
  - field `UploadSpaceResult.Duplicates`
  - schema `UploadDuplicate`
  - schema `UploadRegistryCredentials`
  - schema `UploadUnitRef`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.15 — 2026-09-14

### API spec

- ConfigHub v0.4.19
  Re-pinned the ConfigHub spec from `v0.4.20` to `v0.4.19` and regenerated both clients.

  **Removed (7) — breaking for anyone typed against the old spec**

  - schema `UploadDuplicate`
  - schema `UploadRegistryCredentials`
  - field `UploadResult.SourceDigest`
  - field `UploadSourceInfo.Credentials`
  - field `UploadSourceInfo.Pull`
  - field `UploadSpaceResult.Duplicates`
  - schema `UploadUnitRef`

  Release this as a **minor** bump of the js-sdk packages, and check the hand-written
  code (`packages/*/src`, excluding the generated `schema.d.ts` and `confighubApi.gen.ts`)
  for anything that referenced these.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.14 — 2026-09-14

### API spec

- ConfigHub v0.4.20
  Re-pinned the ConfigHub spec from `v0.4.19` to `v0.4.20` and regenerated both clients.

  **Added (7) — backward compatible**

  - field `UploadResult.SourceDigest`
  - field `UploadSourceInfo.Credentials`
  - field `UploadSourceInfo.Pull`
  - field `UploadSpaceResult.Duplicates`
  - schema `UploadDuplicate`
  - schema `UploadRegistryCredentials`
  - schema `UploadUnitRef`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.13 — 2026-09-13

### API spec

- ConfigHub v0.4.19
  Re-pinned the ConfigHub spec from `v0.4.18` to `v0.4.19` and regenerated both clients.

  **Added (2) — backward compatible**

  - parameter `include` on `POST /upload`
  - field `UploadComponentRequest.DependsOn`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.12 — 2026-09-13

### API spec

- ConfigHub v0.4.18
  Re-pinned the ConfigHub spec from `v0.4.17` to `v0.4.18` and regenerated both clients.

  **Removed (1) — breaking for anyone typed against the old spec**

  - field `UploadComponentResult.RecordUnitID`

  Release this as a **minor** bump of the js-sdk packages, and check the hand-written
  code (`packages/*/src`, excluding the generated `schema.d.ts` and `confighubApi.gen.ts`)
  for anything that referenced these.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.11 — 2026-09-12

### API spec

- ConfigHub v0.4.17
  Re-pinned the ConfigHub spec from `v0.4.16` to `v0.4.17` and regenerated both clients.

  **Added (13) — backward compatible**

  - path `/upload`
  - schema `UploadBrokenEdge`
  - schema `UploadComponentRequest`
  - schema `UploadComponentResult`
  - schema `UploadLinkResult`
  - schema `UploadNamespaceCollision`
  - schema `UploadRequest`
  - schema `UploadRequestFile`
  - schema `UploadResult`
  - schema `UploadSourceInfo`
  - schema `UploadSpaceResult`
  - schema `UploadUnitResult`
  - schema `UploadUnmatchedReference`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.10 — 2026-09-12

### API spec

- ConfigHub v0.4.16
  Re-pinned the ConfigHub spec from `v0.4.15` to `v0.4.16` and regenerated both clients.

  The generated surface is unchanged — only the pinned version moved.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.9 — 2026-09-11

### API spec

- ConfigHub v0.4.15
  Re-pinned the ConfigHub spec from `v0.4.14` to `v0.4.15` and regenerated both clients.

  **Added (13) — backward compatible**

  - path `/change_workflow`
  - path `/space/{space_id}/change_workflow`
  - path `/space/{space_id}/change_workflow/{change_workflow_id}`
  - field `ChangeOrder.ChangeWorkflow`
  - field `ChangeOrder.ChangeWorkflowID`
  - field `ExtendedSpace.TotalChangeWorkflowCount`
  - schema `ChangeWorkflow`
  - schema `ChangeWorkflowCreateOrUpdateResponse`
  - schema `ChangeWorkflowFinalStage`
  - schema `ChangeWorkflowPrerequisite`
  - schema `ChangeWorkflowSpec`
  - schema `ChangeWorkflowStage`
  - schema `ExtendedChangeWorkflow`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.8 — 2026-09-10

### API spec

- ConfigHub v0.4.14
  Re-pinned the ConfigHub spec from `v0.4.13` to `v0.4.14` and regenerated both clients.

  **Removed (22) — breaking for anyone typed against the old spec**

  - path `/space/{space_id}/unit/{unit_id}/extended`
  - field `Attribute.CursorID`
  - field `BridgeWorker.CursorID`
  - field `ChangeOrder.CursorID`
  - field `ChangeSet.CursorID`
  - field `Filter.CursorID`
  - field `Invocation.CursorID`
  - field `Link.CursorID`
  - field `Mutation.CursorID`
  - field `Organization.CursorID`
  - field `Release.CursorID`
  - field `Resource.CursorID`
  - field `Revision.CursorID`
  - field `Space.CursorID`
  - field `Tag.CursorID`
  - field `Target.CursorID`
  - field `Trigger.CursorID`
  - field `Unit.CursorID`
  - field `UnitEvent.CursorID`
  - schema `UnitExtended`
  - field `User.CursorID`
  - field `View.CursorID`

  Release this as a **minor** bump of the js-sdk packages, and check the hand-written
  code (`packages/*/src`, excluding the generated `schema.d.ts` and `confighubApi.gen.ts`)
  for anything that referenced these.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.7 — 2026-09-10

### API spec

- ConfigHub v0.4.13
  Re-pinned the ConfigHub spec from `v0.4.12` to `v0.4.13` and regenerated both clients.

  **Added (12) — backward compatible**

  - parameter `where_data_engine` on `POST /function/invoke`
  - parameter `where_data_engine` on `POST /space/{space_id}/function/invoke`
  - parameter `where_data_engine` on `GET /space/{space_id}/unit`
  - parameter `where_data_engine` on `GET /unit`
  - parameter `where_data_engine` on `GET /unit_data`
  - parameter `where_data_engine` on `GET /unit_mutation_sources`
  - field `Revision.NeededPaths`
  - field `Revision.ProvidedPaths`
  - field `Revision.ValidationPassed`
  - field `Revision.ValidationResults`
  - field `Revision.Values`
  - field `Unit.HeadRevisionID`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

## 0.4.6 — 2026-09-09

### API spec

- pin ConfigHub v0.4.11, generated clients unchanged
- ConfigHub v0.4.12
  Re-pinned the ConfigHub spec from `v0.4.11` to `v0.4.12` and regenerated both clients.

  **Added (13) — backward compatible**

  - parameter `change_order` on `POST /function/invoke`
  - parameter `change_order` on `POST /space/{space_id}/function/invoke`
  - field `ChangeOrder.InvocationID`
  - field `ChangeOrder.Parameters`
  - field `ChangeOrder.UnitFilterID`
  - field `ChangeOrder.WhereUnit`
  - field `ExtendedChangeOrder.Invocation`
  - field `ExtendedChangeOrder.UnitFilter`
  - field `FunctionInvocationsRequest.UpdateValidationResults`
  - field `Revision.ValidationErrors`
  - field `Revision.ValidationWarnings`
  - field `Unit.ValidationErrors`
  - field `Unit.ValidationWarnings`

  Nothing was removed, so a **patch** bump of the js-sdk packages is enough.

  The js-sdk packages carry their own version, independent of the spec: merge this, then
  push a `vX.Y.Z` tag to publish. `.spec-version` records which ConfigHub release the
  generated clients target.

### Maintenance

- **release:** full history for git-cliff; the 0.4.5 changelog section, regenerated

## 0.4.5 — 2026-09-08

### Features

- **react-auth:** sessions persist by default, and an expired token re-authenticates itself **(breaking)**

### Documentation

- **readme:** how versions, the automatic re-pin, publishing, the changelog and GitHub releases fit together

### Maintenance

- **release:** CHANGELOG.md and a GitHub release generated from commits
- **update-spec:** publish only when the generated clients changed

## 0.4.4 (react-auth, hand-written)

- A redirect carrying an authorization code that this tab holds no PKCE state for
  (Keycloak's password-reset and verify-email links finish the login in the tab the
  mail opened) no longer surfaces as "no PKCE state; restart login". It is treated
  as a normal load, so the caller's usual login start runs and completes silently
  against the now-live IdP session.

## 0.4.3 (react-auth, hand-written)

- A login that comes back with an IdP token naming no organization (a fresh brokered
  login, e.g. Google after logout, where Keycloak's organization step does not run)
  no longer surfaces as an exchange error: the login is retried once with no hint,
  and with the SSO session now alive the IdP prompts. Any remembered alias is
  forgotten first. `OrganizationMissing` is exported for callers that drive
  `completeLoginFromRedirect` themselves.

## 0.4.2 (react-auth, hand-written)

- `login()` remembers the organization of the last successful login (its Keycloak
  alias, per client, in `localStorage`) and hints it by default, so a new tab or a
  login after logout does not stop at Keycloak's organization picker.
  `login({ organization: null })` asks on purpose. `rememberedOrganization(clientId)`
  and `organizationAliasOf(claims)` are exported.

## 0.2.0 (react-auth, hand-written)

### Minor Changes

- Fixed redirect URI (`{origin}{callbackPath}`, default `/`); the page a login
  started from travels in the PKCE state and is restored on return. Register one
  redirect URI per origin instead of one per page.
- `login(options)`: `returnTo`, `organization` (Keycloak alias hint, sent as the
  `organization:<alias>` scope), `prompt: 'none' | 'login'`. A `prompt=none` round
  trip that comes back `login_required` resolves to `unauthenticated` instead of
  throwing.
- `logout({ endSession, postLogoutRedirectUri })`: RP-initiated logout at the IdP's
  `end_session_endpoint` with `id_token_hint`; the `id_token` is kept on the session.
- `switchOrganization(orgId)`: `POST /auth/switch-organization` with the bearer token.
- `reauthenticate()`: silent re-auth for the session's own organization with status
  held at `loading`; used by the client's 401 path when `onUnauthorized` is `'login'`.
- `persist: 'session'` keeps the session in `sessionStorage` across reloads.
- New exports: `callbackUri`, `decodeJwtClaims`, `isExpired`, `LoginOptions`,
  `LogoutOptions`, `FlowOptions`.

### Breaking

- `login` and `logout` take an options object, so `onClick={login}` must become
  `onClick={() => login()}` (a click event is not `LoginOptions`).

## 0.1.0 (react-auth, hand-written)

### Minor Changes

- 4172cc4: Initial public release: `@confighub/api` (typed openapi-fetch client),
  `@confighub/react-auth` (browser auth provider + hooks), and `@confighub/rtk-query`
  (RTK Query client).

### Patch Changes

- Updated dependencies [4172cc4]
  - @confighub/api@0.1.0
