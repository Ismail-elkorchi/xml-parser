# Canonicalization and Signatures

Canonical APIs produce deterministic byte-equivalent XML normalization for
hashing, signature generation, and signing.

## When to use canonicalization

Use canonicalization when signatures or digests must remain stable across
equivalent serializations of the same XML tree.

Constraints:
- Canonical output is based on the parsed document tree, not author formatting.
- External entities and unsafe DTD expansion are intentionally not part of the
  supported trust model.
- Namespace semantics are preserved, but presentation details such as prefix
  spelling or attribute ordering may be normalized.

## Canonical digest flow

```ts
import { computeCanonicalSha256, parseXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<root><item id=\"1\"/></root>");
const digest = await computeCanonicalSha256(document);
console.log(typeof digest === "string");
```

Expected output:
- `true`

## Signature flow

Use `signCanonicalXml()` and `verifyCanonicalXmlSignature()` to bind canonical
output to your signer/verifier implementation.

## Common failure modes

- Digest mismatches caused by signing raw source text instead of canonical
  output.
- Namespace-sensitive documents are reparsed after application-layer mutation,
  which changes the canonical form.
- Signature verification assumes browser-style entity or DTD expansion that the
  parser deliberately does not perform.

## Related

- [Error model](./error-model.md)
- [Options](./options.md)
- [Configure safe DTD and XXE handling](../how-to/configure-safe-dtd-xxe-handling.md)
