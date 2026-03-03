# Mutation Pilot (Advisory)

This document describes the first mutation-testing pilot for `xml-parser`.

## Scope

Pilot target:
- `dist/internal/hash.js`

Pilot exclusions:
- parser integration and stream runtime paths
- oracle comparison and release attestation flows
- publish workflow logic

Why this scope:
- Canonical JSON hashing is deterministic and reused by quality/security evidence flows.
- Mutants are cheap to execute and triage.
- The pilot remains advisory and bounded.

## Commands

```bash
npm run mutation:pilot
```

The pilot command builds once, applies configured mutants, and runs focused tests:
- config: `scripts/mutation/pilot-config.json`
- output: `docs/reference/mutation-pilot-report.json`

## Baseline and hardening delta

Baseline snapshot (before hardening tests):
- report: `docs/reference/mutation-pilot-report-baseline.json`
- result: `killed=1`, `survived=3`, `total=4`

Survivors identified in baseline:
- `non-recursive-canonicalize`
- `hash-xor-disabled`
- `prime-constant-changed`

Hardening changes introduced in this pilot:
- added nested canonicalization assertion
- added same-length payload hash-difference assertion
- added fixed known-hash assertion for stable algorithm behavior

Final pilot result after hardening:
- report: `docs/reference/mutation-pilot-report.json`
- result: `killed=4`, `survived=0`, `total=4`

## Residual risk

This pilot is advisory and narrow by design.
Mutation results do not replace `npm run eval:release` validation.
