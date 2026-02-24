# Canonicalization and Signature Verification

The canonical layer provides deterministic canonical XML rendering and detached signature verification helpers.

## API
- `canonicalizeXml(input)`
- `computeCanonicalSha256(input)`
- `verifyCanonicalSha256(input, expectedHex)`
- `signCanonicalXml(input, privateKey, algorithm?)`
- `verifyCanonicalXmlSignature(input, signature, publicKey, algorithm?)`

## Canonical form contract
- Element traversal: depth-first pre-order.
- Attribute order: namespace URI then QName lexical order.
- Escaping is deterministic for text and attributes.
- Canonical output always emits explicit end tags.

## Scope boundaries
- Not full W3C C14N compatibility.
- Detached-signature helpers require WebCrypto keys from caller.
