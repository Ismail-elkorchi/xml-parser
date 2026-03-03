# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | yes |
| latest `0.x` release line | yes |
| older `0.x` lines | no |

## Reporting a vulnerability

Report vulnerabilities privately through GitHub Security Advisories:

`https://github.com/Ismail-elkorchi/xml-parser/security/advisories/new`

Include reproduction input, expected behavior, observed behavior, impact details, and runtime/version context.

## XML threat posture (XXE/DTD/entity expansion)

- DTD declarations are rejected by default.
- External entity declarations are rejected by default.
- Unbounded entity expansion is not enabled.
- Undefined entities are surfaced as parse errors.

This default behavior is intended to block common XXE and entity expansion abuse paths.

## Safe configuration guidance

- Keep `strict: true` for untrusted input.
- Set explicit parse budgets (`maxInputBytes`, `maxStreamBytes`, `maxNodes`, `maxDepth`, `maxTextBytes`, `maxTimeMs`).
- Treat parse errors as hard failures in ingestion pipelines that process untrusted XML.

## Verification commands

```bash
npm run check:fast
npm run examples:run
npm run test:fuzz
npm run docs:lint:jsr
npm run docs:test:jsr
```
