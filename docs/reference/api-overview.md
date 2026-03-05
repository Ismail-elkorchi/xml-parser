# API Overview

All exported runtime entrypoints from `src/mod.ts`.

## Parsing and serialization
- `XmlBudgetExceededError`
- `getParseErrorSpecRef(parseErrorId)`
- `parseXml(input, options?)`
- `parseXmlBytes(input, options?)`
- `parseXmlStream(stream, options?)`
- `tokenizeXml(input, options?)`
- `serializeXml(documentOrNode)`

## Query and traversal
- `iterateElements(documentOrNode)`
- `findFirstElementByQName(documentOrNode, qName)`
- `listElementsByQName(documentOrNode, qName)`
- `listElementsByAttribute(documentOrNode, name, value?)`
- `listElementsByNamespace(documentOrNode, namespaceUri)`
- `listTextNodes(documentOrNode)`

## Validation and diagnostics
- `validateXmlProfile(document, profile)`
- `createXmlReplayContract(document, options?)`
- `verifyXmlReplayContract(contract, options?)`

## Canonicalization and signatures
- `canonicalizeXml(input)`
- `computeCanonicalSha256(input)`
- `verifyCanonicalSha256(input, expectedDigest)`
- `signCanonicalXml(input, signer)`
- `verifyCanonicalXmlSignature(input, signature, verifier)`

## Related
- [Options](./options.md)
- [Error model](./error-model.md)
- [Canonicalization and signatures](./canonicalization.md)
