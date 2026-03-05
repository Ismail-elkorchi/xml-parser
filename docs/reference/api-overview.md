# API Overview

## JSR Surface

JSR exports are defined by [`jsr/mod.ts`](../../jsr/mod.ts).

Runtime exports:
- Parsing and serialization: `parseXml`, `parseXmlBytes`, `parseXmlStream`, `tokenizeXml`, `serializeXml`
- Validation: `validateXmlProfile`
- Canonicalization and signatures: `canonicalizeXml`, `computeCanonicalSha256`, `verifyCanonicalSha256`, `signCanonicalXml`, `verifyCanonicalXmlSignature`

Type exports include `XmlParseBudgets`, `XmlParseOptions`, `XmlDocument`, `XmlNode`, `XmlToken`, `XmlParseError`, `XmlValidationProfile`, `XmlValidationIssue`, `XmlValidationResult`, and `CanonicalInput`.

## Node/npm Surface

Node/npm type surface is shipped from `dist/mod.d.ts` (source module: `src/mod.ts`).

In addition to JSR exports, Node/npm includes traversal/query helpers, replay-contract helpers, and parser error helper exports.

## JSR Surface vs Node Surface

- JSR focuses on parse, validation, and canonicalization entrypoints.
- Node/npm additionally exposes traversal helpers, replay helpers, and error helper utilities.

## Related
- [Options](./options.md)
- [Data model](./data-model.md)
- [Error model](./error-model.md)
- [Canonicalization and signatures](./canonicalization.md)
