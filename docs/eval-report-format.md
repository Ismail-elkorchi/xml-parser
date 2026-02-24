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
  - `suite`, `timestamp`, `ok`, `caseCount`, `passCount`, `failCount`, `categories[]`, `failures[]`, `cases[]`
  - `categories[]`: `category`, `total`, `pass`, `fail`, `passRate`, `minPassRate`, `ok`
- `tree-namespace.json`
  - `suite`, `timestamp`, `ok`, `fixtures[]`
- `stream-budgets.json`
  - `suite`, `timestamp`, `ok`, `parityOk`, `budgetFailureOk`, `budgetFailure`
- `serializer-determinism.json`
  - `suite`, `timestamp`, `ok`, `deterministic`, `roundtripOk`
- `security-adversarial.json`
  - `suite`, `timestamp`, `ok`, `corpus`, `fuzz`
  - `corpus`: `total`, `pass`, `fail`, `failures[]`
  - `fuzz`: `seed`, `total`, `crashCount`, `budgetThrowCount`, `parseErrorCount`, `topSlowest[]`, `parseErrorFrequency`
- `integration-reliability.json`
  - `suite`, `timestamp`, `ok`, `fixtures[]`
- `performance-complexity.json`
  - `suite`, `timestamp`, `ok`, `limits`, `checks`, `scenarios[]`
  - `checks`: `parseErrorFree`, `nsPerByteRatio`, `growthRatio`
- `oracle-independent.json` (release profile)
  - `suite`, `timestamp`, `ok`, `available`, `oracle`, `compared`, `excludedCount`, `excludedCaseIds[]`, `nonGoalParseErrorIds[]`, `mismatches[]`
  - `oracle`: `tool`, `version`, `executablePath`, `executableSha256`
- `release-readiness.json` (release profile)
  - `suite`, `timestamp`, `ok`, `packFileCount`, `missing[]`, `docsOk`

## Gate and summary reports
- `gates.json`
  - `suite`, `timestamp`, `profile`, `ok`, `checks[]`
  - each check includes `gate`, `report`, `ok`, `details`
- `eval-summary.json`
  - `suite`, `timestamp`, `profile`, `ok`, `reports[]`

## Local oracle reports (non-gated)
- `oracle-xmllint.json`
  - `suite`, `timestamp`, `ok`, `available`, `compared`, `mismatches[]`
