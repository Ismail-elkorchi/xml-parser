# ADR-005: cross-runtime determinism gate

## Status
Accepted

## Context

`xml-parser` targets Node, Deno, and Bun. Runtime smoke existed, but release and CI profiles did not require a single gate-backed artifact proving hash agreement across all three runtimes.

## Decision

Add `cross-runtime-determinism` as a required report in CI and release profiles:

- producer: `scripts/quality/eval/check-cross-runtime-determinism.mjs`
- gate id: `G-104`
- required runtimes: `node`, `deno`, `bun`

The report is `ok=true` only when:

- all runtime smoke executions succeed,
- each execution emits a determinism hash,
- all hashes are identical.

## Consequences

- Any missing runtime evidence fails evaluation.
- Hash disagreement fails evaluation in both CI and release.
- Runtime parity claims are now backed by a required artifact.
