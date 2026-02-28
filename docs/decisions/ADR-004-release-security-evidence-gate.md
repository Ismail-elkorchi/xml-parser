# ADR-004: release security evidence gate

## Status
Accepted

## Context

`eval:release` required adversarial security and governance reports, but it did not require a dedicated artifact that proves release-time security evidence is present and coherent.

## Decision

Add `security-evidence` as a release-required report and gate:

- producer: `scripts/eval/check-security-evidence.mjs`
- gate map id: `G-103`
- profile scope: release

`security-evidence` is `ok=true` only when:

- `SECURITY.md` exists,
- `docs/security-triage.md` exists,
- CodeQL workflow includes weekly schedule and explicit `security-extended` lane policy,
- `reports/security-adversarial.json` is present and passing,
- `reports/governance-baseline.json` is present and passing.

## Consequences

- Release evaluation fails when security artifacts are missing or inconsistent.
- CI profile remains unchanged to avoid redundant work in the fast loop.
