# Changesets

This directory is managed by [changesets](https://github.com/changesets/changesets).
Every change that should ship a new version of `@confighub/api` or
`@confighub/react-auth` needs a changeset. Add one with:

```
npm run changeset
```

Pick the affected packages and a semver bump, then commit the generated markdown
file alongside your change. Releases (`changeset version` + `changeset publish`)
consume these files.

The `sync-spec` workflow adds a changeset automatically when it regenerates the
client from a new pinned spec version.
