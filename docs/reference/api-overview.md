# API Overview

This page tracks exported functions from `src/mod.ts`.

## Parsing and serialization
- `parseXml`
- `parseXmlBytes`
- `parseXmlStream`
- `tokenizeXml`
- `serializeXml`
- `getParseErrorSpecRef`

## Query and traversal
- `iterateElements`
- `findFirstElementByQName`
- `listElementsByQName`
- `listElementsByAttribute`
- `listElementsByNamespace`
- `listTextNodes`

## Validation and diagnostics
- `validateXmlProfile`
- `createXmlReplayContract`
- `verifyXmlReplayContract`

## Canonicalization and signature helpers
- `canonicalizeXml`
- `computeCanonicalSha256`
- `verifyCanonicalSha256`
- `signCanonicalXml`
- `verifyCanonicalXmlSignature`
