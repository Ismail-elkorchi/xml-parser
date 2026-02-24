# Acceptance Gates

All evaluation artifacts are generated under `reports/`.

## Gate map
- `G-001`: governance-baseline
- `G-010`: no-runtime-deps
- `G-020`: no-node-builtins
- `G-030`: scope-threat-model
- `G-040`: parse-error-taxonomy
- `G-050`: tokenizer-determinism
- `G-055`: conformance-fixtures
- `G-060`: tree-namespace
- `G-070`: stream-budgets
- `G-080`: security-adversarial
- `G-090`: serializer-determinism
- `G-100`: integration-reliability
- `G-105`: oracle-independent
- `G-110`: release-readiness
- `G-115`: performance-complexity

## CI profile
Required reports:
- `reports/governance-baseline.json` with `ok=true`
- `reports/no-runtime-deps.json` with `ok=true`
- `reports/no-node-builtins.json` with `ok=true`
- `reports/scope-threat-model.json` with `ok=true`
- `reports/parse-error-taxonomy.json` with `ok=true`
- `reports/tokenizer-determinism.json` with `ok=true`
- `reports/conformance-fixtures.json` with `ok=true`
- `reports/tree-namespace.json` with `ok=true`
- `reports/stream-budgets.json` with `ok=true`
- `reports/security-adversarial.json` with `ok=true`
- `reports/serializer-determinism.json` with `ok=true`
- `reports/integration-reliability.json` with `ok=true`
- `reports/performance-complexity.json` with `ok=true`

## Release profile
Required reports:
- all CI reports
- `reports/oracle-independent.json` with `ok=true`
- `reports/release-readiness.json` with `ok=true`

## Policy
- Runtime dependencies remain empty.
- Runtime code under `src/` does not import Node builtins.
- DTD/external entities are default-deny.
- Budget exhaustion must fail with structured error semantics.
