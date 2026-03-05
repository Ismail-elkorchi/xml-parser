# CI Failure Postmortem (v0.1.1 Publish)

## Scope
- Workflow: `Publish`
- Trigger: release `v0.1.1`
- Run: https://github.com/Ismail-elkorchi/xml-parser/actions/runs/22651364886
- Failing step: `Run JSR publish dry-run`

## What failed?
`npx -y jsr publish --dry-run` exited with code `1` in the publish workflow.

## Why did it fail?
The failing step reported:
1. A JSR dynamic-import analysis warning (`unable to analyze dynamic import`) in `scripts/quality/eval/check-agent-diagnostics-replay.mjs` at `:70:32`.
2. A terminal error (`Aborting due to uncommitted changes`) once workflow-generated artifacts made the repository dirty inside the same job.

Publish stopped before any registry push.

## What change in this PR series removes the failure?
The release/tooling PR in this series removes this failure class by:
- limiting publish-time analysis to package files,
- ensuring dry-run steps remain stable when artifacts are generated,
- and adding a manual publish dry-run workflow that validates the full path safely.

## Proof
- Workflow evidence: https://github.com/Ismail-elkorchi/xml-parser/actions/runs/22651364886
- Log extraction command:
  ```bash
  gh run view 22651364886 --log-failed
  ```
