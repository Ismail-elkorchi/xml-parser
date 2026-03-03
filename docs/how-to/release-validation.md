# Release Validation Checklist

Release execution is tag-based (`v*`) in `.github/workflows/release.yml`.
The workflow runs quality gates and `eval:release` before publish steps.

## Package identity

- Intended public npm package name: `@ismail-elkorchi/xml-parser`
- Intended public JSR package name: `@ismail-elkorchi/xml-parser`
- Versioning policy: `0.x` while hardening is active.

## Registry ownership status (March 3, 2026)

- npm: `npm view @ismail-elkorchi/xml-parser` returns `404` (package not claimed/published yet).
- JSR: `jsr info @ismail-elkorchi/xml-parser` returns `404` (package not claimed/published yet).

Publish steps stay gated until registry ownership is confirmed.

## Required checks

Run this sequence before release/publish decisions:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run examples:run
npm test
npm run smoke:all
npm run smoke:browser
npm run eval:release
```

## Dry-runs

```bash
npm pack --dry-run
npm publish --dry-run
npx -y jsr publish --dry-run
```

## Release workflow publish gate

Tag release workflow publish steps only run when all conditions are true:
1. `github.ref` is a tag (`refs/tags/v*`)
2. repository variable `ENABLE_REGISTRY_PUBLISH` is set to `true`
3. required registry credentials/trust are configured (`NPM_TOKEN` for npm fallback; OIDC trust for JSR)

## JSR prerequisites

JSR publishing in GitHub Actions is tokenless and uses OIDC (`id-token: write`).

Before tag-based publishing:
1. Link the JSR package to this GitHub repository in JSR settings.
2. Confirm the release workflow identity is allowed by JSR for OIDC publish.
3. Keep `jsr.json` package identity aligned with repository release identity.

## npm prerequisites

Target release posture is npm Trusted Publishing (OIDC).

Before enabling tag-based npm publish:
1. Configure the npm package settings to trust this repository release workflow.
2. Validate OIDC trusted publishing for tag-triggered releases.
3. Confirm package visibility and access policy (`public`) in npm settings.

## Falsification probe

Run an independent canary parse + profile validation command outside the default suite.

## 0.1.0 dry-run evidence snapshot (March 3, 2026)

Dry-runs:
- `npm pack --dry-run --json`: pass
- `npm publish --dry-run --json --access public`: pass
- `npx -y jsr publish --dry-run --allow-dirty`: pass

Canary packed-artifact check:
- packed artifact extracted and imported from `dist/mod.js`
- parse/serialize canary (`<root><item/></root>`) passes

Manual artifact sample review:
- required entries present: `package.json`, `dist/mod.js`, `dist/mod.d.ts`, `README.md`, `LICENSE`
- forbidden content absent: `scripts/`, `test*/`, `docs/`, `reports/`

Automation freshness evidence:
- Release Audit: success (run `22622280840`)  
  <https://github.com/Ismail-elkorchi/xml-parser/actions/runs/22622280840>
- Runtime Latest (Non-blocking): success (run `22622280867`)  
  <https://github.com/Ismail-elkorchi/xml-parser/actions/runs/22622280867>
