# Options and API Reference

This page is the primary API surface summary for `@ismail-elkorchi/xml-parser`.

## Core API

- `parseXml(input, options?)`
- `parseXmlBytes(input, options?)`
- `parseXmlStream(stream, options?)`
- `serializeXml(documentOrNode)`
- `tokenizeXml(input, options?)`
- `validateXmlProfile(input, profile)`
- `canonicalizeXml(input)`
- `computeCanonicalSha256(input)`

## Parse options

- `strict?: boolean` (default: `true`)
- `budgets?: Partial<XmlParseBudgets>`

`strict: false` is an explicit opt-in compatibility mode. Keep `strict: true` for untrusted input paths.

## XmlParseBudgets keys

- `maxInputBytes`
- `maxStreamBytes`
- `maxNodes`
- `maxDepth`
- `maxAttributesPerElement`
- `maxTextBytes`
- `maxErrors`
- `maxTimeMs`

## Security-relevant behavior

- DTD declarations are rejected by default.
- External entity declarations are rejected by default.
- Undefined entities are reported as parse errors.
- Budget overruns throw `XmlBudgetExceededError`.

## Verify these claims

```bash
npm run check:fast
npm run examples:run
npm run docs:lint:jsr
npm run docs:test:jsr
```
