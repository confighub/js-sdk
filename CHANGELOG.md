# Changelog

`@confighub/api`, `@confighub/react-auth` and `@confighub/rtk-query` publish together at one
version; `X.Y` names the ConfigHub API the packages were generated against (see README,
"Versions"). Sections from 0.4.5 on are generated from commit history by
[git-cliff](https://git-cliff.org) at publish time (`cliff.toml`); the same text is the
GitHub release's notes. An "API spec" entry is a re-pin to a new ConfigHub release and
lists what the generated surface gained or lost.

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
