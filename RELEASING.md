# Releasing

1. Set the same version in `package.json`, `package-lock.json`, and `jsr.json`.
2. Move the relevant `CHANGELOG.md` entries under a dated version heading.
3. Run `npm ci` and `npm run qualification:release` locally.
4. Merge the release change to `main` after hosted checks pass.
5. Tag that exact `main` commit as `vX.Y.Z` and create the GitHub release for the tag.

The release event is the only publishing path. Its workflow requires the tag, event SHA, checkout, and current `main` to identify the same commit. It qualifies that source once, preserves and verifies the exact npm tarball, dry-runs JSR through a pinned Deno release, and publishes to JSR and npm using GitHub OIDC. Registry verification then compares the complete JSR file manifest and npm artifact integrity and provenance with the qualified source.

The workflow is safe to rerun for the same immutable release: it skips a registry only when that version is byte-for-byte identical to the qualified publication. Never move an existing tag. If a registry contains conflicting immutable content, diagnose the source and publish a corrected new version.
