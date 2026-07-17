# Changelog

All notable changes are documented in this file.

## Unreleased

- Prepare version 0.2.0 with unconditional XML 1.0 well-formedness checks,
  Unicode names, line-ending normalization, and namespace constraint fixes.
- Enforce error and end-to-end time budgets across tokenization, entity decoding,
  tree construction, and deterministic hashing.
- Reject malformed UTF-8 with a structured decoding error and release stream
  readers on every success and failure path.
- Remove the permissive `strict` option and align JSR declarations with the
  package's real public types; version replay contracts as `xml-replay-v2` for
  the changed parse-option semantics.
- Repair recursive test discovery, current Deno documentation output handling,
  and vulnerable development tooling.

## [0.1.1] - 2026-03-04
- Add OIDC `publish.yml` workflow for npm Trusted Publishing and JSR publish on release events.
- Add publish manifest evidence and deterministic tag/version parity checks before publish.
- Documentation front-door and docs-map upgrade.
- Added runnable examples (`npm run examples:run`).
- Added `jsr.json` baseline and validated dry-run path.
- Reorganized operational docs/config/check scripts into stable public paths.

## [0.1.0] - 2026-03-04
- First public release of `@ismail-elkorchi/xml-parser`.
- npm + JSR package metadata, docs surface, and release automation hardened for deterministic publishing.
