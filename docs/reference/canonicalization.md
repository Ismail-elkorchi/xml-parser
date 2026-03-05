# Canonicalization and Signatures

Canonical APIs produce deterministic byte-equivalent XML normalization for hashing, signature generation, and signing.

## Canonical digest flow

```ts
import { computeCanonicalSha256, parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item id=\"1\"/></root>");
const digest = computeCanonicalSha256(document);
console.log(typeof digest === "string");
```

## Signature flow

Use `signCanonicalXml()` and `verifyCanonicalXmlSignature()` to bind canonical output to your signer/verifier implementation.
