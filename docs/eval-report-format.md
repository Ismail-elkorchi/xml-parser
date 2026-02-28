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
- `query-layer.json`
  - `suite`, `timestamp`, `ok`, `checks`, `observed`
- `schema-validation.json`
  - `suite`, `timestamp`, `ok`, `checks`, `profile`, `validResult`, `invalidResult`
- `canonical-signature.json`
  - `suite`, `timestamp`, `ok`, `checks`, `canonicalLength`, `digest`, `signatureBytes`
- `agent-diagnostics-replay.json`
  - `suite`, `timestamp`, `ok`, `checks`, `runtimes`
  - `checks`: `exportsPresent`, `docsPresent`, `runtimeCommandsOk`, `validCrossRuntimeEqual`, `malformedCrossRuntimeEqual`, `validIncludesToken`, `validIncludesTreeNode`, `validIncludesSummary`, `malformedIncludesParseError`
  - `runtimes`: fixture buckets `valid` and `malformed`, each with `node`, `deno`, `bun` payloads including `replayHash`, `determinismHash`, `eventKinds`, `eventCount`, `truncated`
- `tree-namespace.json`
  - `suite`, `timestamp`, `ok`, `fixtures[]`
- `stream-budgets.json`
  - `suite`, `timestamp`, `ok`, `parityOk`, `budgetFailureOk`, `budgetFailure`
- `serializer-determinism.json`
  - `suite`, `timestamp`, `ok`, `deterministic`, `roundtripOk`
- `security-adversarial.json`
  - `suite`, `timestamp`, `ok`, `limits`, `checks`, `corpus`, `fuzz`
  - `limits`: `minFuzzRuns`, `maxCrashCount`, `minUniqueParseErrorIds`
  - `checks`: `corpusFailures`, `fuzzRunCount`, `crashCount`, `parseErrorCoverage`
  - `corpus`: `total`, `pass`, `fail`, `failures[]`
  - `fuzz`: `seed`, `total`, `crashCount`, `budgetThrowCount`, `parseErrorCount`, `topSlowest[]`, `uniqueParseErrorIds`, `parseErrorFrequency`
- `security-evidence.json` (release profile)
  - `suite`, `timestamp`, `ok`, `checks`
  - `checks`: `securityPolicyDoc`, `securityTriageDoc`, `codeqlSchedulePresent`, `codeqlSecurityExtendedLane`, `securityAdversarialReportOk`, `governanceBaselineReportOk`
- `integration-reliability.json`
  - `suite`, `timestamp`, `ok`, `fixtures[]`
- `browser-smoke.json`
  - `suite`, `timestamp`, `ok`, `runtime`, `version`, `userAgent`, `hash`, `determinismHash`, `checks`, `requiredChecks`, `requiredChecksOk`
- `cross-runtime-determinism.json`
  - `suite`, `timestamp`, `ok`, `runtimes`, `crossRuntime`, `overall`
  - `crossRuntime`: `ok`, `requiredRuntimes`, `observedHashes`, `uniqueHashCount`
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
