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
- `G-058`: query-layer
- `G-059`: schema-validation
- `G-060`: tree-namespace
- `G-061`: canonical-signature
- `G-062`: agent-diagnostics-replay
- `G-070`: stream-budgets
- `G-080`: security-adversarial
- `G-090`: serializer-determinism
- `G-100`: integration-reliability
- `G-102`: browser-smoke
- `G-103`: security-evidence
- `G-105`: oracle-independent
- `G-110`: release-readiness
- `G-115`: performance-complexity
- `G-129`: require-flag producer coherence

## CI profile
Required reports:
- `reports/governance-baseline.json` with `ok=true`
- `reports/no-runtime-deps.json` with `ok=true`
- `reports/no-node-builtins.json` with `ok=true`
- `reports/scope-threat-model.json` with `ok=true`
- `reports/parse-error-taxonomy.json` with `ok=true`
- `reports/tokenizer-determinism.json` with `ok=true`
- `reports/conformance-fixtures.json` with `ok=true`
  - category pass thresholds are strict: `core=1.0`, `namespace=1.0`, `declarations=1.0`, `malformed=1.0`, `budgets=1.0`
- `reports/query-layer.json` with `ok=true`
- `reports/schema-validation.json` with `ok=true`
- `reports/canonical-signature.json` with `ok=true`
- `reports/agent-diagnostics-replay.json` with `ok=true`
- `reports/tree-namespace.json` with `ok=true`
- `reports/stream-budgets.json` with `ok=true`
- `reports/security-adversarial.json` with `ok=true`
- `reports/serializer-determinism.json` with `ok=true`
- `reports/integration-reliability.json` with `ok=true`
- `reports/browser-smoke.json` with `ok=true`
- `reports/performance-complexity.json` with `ok=true`

## Release profile
Required reports:
- all CI reports
- `reports/security-evidence.json` with `ok=true`
- `reports/oracle-independent.json` with `ok=true`
- `reports/release-readiness.json` with `ok=true`

## Policy
- Runtime dependencies remain empty.
- Runtime code under `src/` does not import Node builtins.
- DTD/external entities are default-deny.
- Conformance determinism parity applies to normal and malformed inputs across string/bytes/stream paths.
- Agent diagnostics replay artifacts are deterministic across Node/Deno/Bun for stable fixtures.
- Security-adversarial gate requires deterministic fuzz coverage with minimum run count and parse-error diversity.
- Security-evidence gate requires release artifacts to include security evidence report output proving security documentation, CodeQL policy lane/schedule, and prerequisite security reports are present and passing.
- Agent diagnostics replay gate requires exported replay APIs and corresponding contract documentation.
- Budget exhaustion must fail with structured error semantics.
- `G-129` enforces evaluation coherence: each required report in a profile must have a gate map entry and an existing producer script.
