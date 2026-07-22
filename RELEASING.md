# Releasing

1. Set the same version in `package.json`, `package-lock.json`, and `jsr.json`.
2. Move the relevant `CHANGELOG.md` entries under a dated version heading.
3. Run `npm ci` and `npm run qualification:release` locally.
4. Merge the release change to `main` after hosted checks pass.
5. Tag that exact `main` commit as `vX.Y.Z` and create the GitHub release for the tag.

The release event is the only publishing path. Its workflow revalidates tag and manifest parity, verifies that the tag is on `main`, qualifies the checked-out tag, dry-runs JSR through Deno, and publishes to JSR and npm using GitHub OIDC. The npm command publishes the exact tarball produced after qualification.

Do not rerun a failed release by moving an existing tag. Diagnose the registry state, fix the workflow or source on a new commit, and use a new version when either registry already contains the original version.
