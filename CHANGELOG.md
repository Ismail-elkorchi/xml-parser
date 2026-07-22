# Changelog

## Unreleased

- Enforce XML 1.0 character, name, declaration, entity-reference, line-ending, and namespace constraints across all parse paths.
- Apply input, stream, node, depth, attribute, text, diagnostic, and elapsed-time budgets throughout decoding, tokenization, tree construction, and recovery.
- Return tokenizer diagnostics with tokens; use typed configuration, decoding, and budget errors for fatal API failures.
- Validate caller-constructed trees before serialization and preserve referenced XML whitespace characters across serialization round trips.
- Remove permissive parsing modes, misleading canonicalization/signature and replay APIs, the parse-result hash, and their dead tests and tooling.
- Expose one readonly TypeScript contract to npm and JSR, validate packed runtime and declaration consumers, and keep runtime dependencies at zero.
- Replace the generated paperwork and duplicated evaluation scripts with focused behavior, type, conformance, fuzz, browser, cross-runtime, performance, oracle, and package checks.
- Refresh development dependencies and pinned GitHub Actions, disable Dependabot, and restrict publishing to fully qualified GitHub release tags on `main`.
- Rewrite the README, documentation, examples, contribution guidance, security policy, and release instructions around the actual package behavior.

## [0.1.1] - 2026-03-04

- Add npm and JSR package metadata, OIDC publishing, runnable examples, and the initial documentation structure.

## [0.1.0] - 2026-03-04

- Publish the first package release.
