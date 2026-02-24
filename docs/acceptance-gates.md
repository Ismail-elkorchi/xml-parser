# Acceptance Gates

All evaluation artifacts are generated under `reports/`.

## Gate map
- `XG-000`: governance-baseline
- `XG-010`: no-runtime-deps
- `XG-020`: no-node-builtins
- `XG-030`: scope-threat-model
- `XG-040`: parse-error-taxonomy
- `XG-050`: tokenizer-determinism
- `XG-060`: tree-namespace
- `XG-070`: stream-budgets
- `XG-080`: security-adversarial
- `XG-090`: serializer-determinism
- `XG-100`: integration-reliability
- `XG-110`: release-readiness

## CI profile
Required reports:
- `reports/governance-baseline.json` with `ok=true`
- `reports/no-runtime-deps.json` with `ok=true`
- `reports/no-node-builtins.json` with `ok=true`
- `reports/scope-threat-model.json` with `ok=true`
- `reports/parse-error-taxonomy.json` with `ok=true`
- `reports/tokenizer-determinism.json` with `ok=true`
- `reports/tree-namespace.json` with `ok=true`
- `reports/stream-budgets.json` with `ok=true`
- `reports/security-adversarial.json` with `ok=true`
- `reports/serializer-determinism.json` with `ok=true`
- `reports/integration-reliability.json` with `ok=true`

## Release profile
Required reports:
- all CI reports
- `reports/release-readiness.json` with `ok=true`

## Policy
- Runtime dependencies remain empty.
- Runtime code under `src/` does not import Node builtins.
- DTD/external entities are default-deny.
- Budget exhaustion must fail with structured error semantics.
