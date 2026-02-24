# Eval Report Format

All evaluation artifacts are written under `reports/`.

## Core policy reports
- `governance-baseline.json`
  - `suite`, `timestamp`, `ok`, `missing[]`
- `no-runtime-deps.json`
  - `suite`, `timestamp`, `ok`, `dependencies[]`
- `no-node-builtins.json`
  - `suite`, `timestamp`, `ok`, `violations[]`
- `scope-threat-model.json`
  - `suite`, `timestamp`, `ok`, `checks[]`

## Parser behavior reports
- `parse-error-taxonomy.json`
  - `suite`, `timestamp`, `ok`, `deterministicIds`, `ids[]`, `specRef`
- `tokenizer-determinism.json`
  - `suite`, `timestamp`, `ok`, `deterministic`, `tokenCount`, `hash`
- `conformance-fixtures.json`
  - `suite`, `timestamp`, `ok`, `caseCount`, `passCount`, `failCount`, `failures[]`, `cases[]`
- `tree-namespace.json`
  - `suite`, `timestamp`, `ok`, `fixtures[]`
- `stream-budgets.json`
  - `suite`, `timestamp`, `ok`, `parityOk`, `budgetFailureOk`, `budgetFailure`
- `serializer-determinism.json`
  - `suite`, `timestamp`, `ok`, `deterministic`, `roundtripOk`
- `security-adversarial.json`
  - `suite`, `timestamp`, `ok`, `checks[]`
- `integration-reliability.json`
  - `suite`, `timestamp`, `ok`, `fixtures[]`
- `release-readiness.json` (release profile)
  - `suite`, `timestamp`, `ok`, `packFileCount`, `missing[]`, `docsOk`

## Gate and summary reports
- `gates.json`
  - `suite`, `timestamp`, `profile`, `ok`, `checks[]`
  - each check includes `gate`, `report`, `ok`, `details`
- `eval-summary.json`
  - `suite`, `timestamp`, `profile`, `ok`, `reports[]`
