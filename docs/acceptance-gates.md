# Acceptance gates

## CI profile
Required reports:
- `reports/no-runtime-deps.json` with `ok=true`
- `reports/no-node-builtins.json` with `ok=true`

## Release profile
Required reports:
- `reports/no-runtime-deps.json` with `ok=true`
- `reports/no-node-builtins.json` with `ok=true`

## Policy
- Runtime dependencies remain empty.
- Runtime code under `src/` does not import Node builtins.
- Evaluation output is written under `reports/`.
