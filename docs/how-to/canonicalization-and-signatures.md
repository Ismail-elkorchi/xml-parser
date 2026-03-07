# Canonicalization And Signatures

## Goal
Use canonical XML output for stable hashing or signatures, and understand the
constraints that matter before you treat the digest as a trust decision.

## Prerequisites
- `@ismail-elkorchi/xml-parser` installed
- A parsed XML document or root element
- WebCrypto available if you also want digest/signature helpers

## Copy/paste
```ts
import { canonicalizeXml, computeCanonicalSha256, parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root b=\"2\" a=\"1\"><child z=\"9\" y=\"8\">txt &amp; more</child></root>");

console.log(canonicalizeXml(document));
console.log(typeof await computeCanonicalSha256(document) === "string");
```

## Expected output
```txt
<root a="1" b="2"><child y="8" z="9">txt &amp; more</child></root>
true
```

## Common failure modes
- Assuming canonicalization preserves author attribute order; this surface sorts
  attributes deterministically before hashing/signing.
- Treating canonicalization as a full XML Signature implementation. You still
  need your own key management, signer, verifier, and trust policy.
- Forgetting that digest/signature helpers depend on WebCrypto availability in
  the current runtime.

## Related reference
- [Canonicalization and signatures](../reference/canonicalization.md)
- [Error model](../reference/error-model.md)
- [Data model](../reference/data-model.md)
