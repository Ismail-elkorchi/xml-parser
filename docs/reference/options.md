# Options

## Parse options (`parseXml`, `parseXmlBytes`, `parseXmlStream`, `tokenizeXml`)

### `strict`
- Type: `boolean`
- Default: `true`
- Enforces strict XML well-formedness behavior.

### `budgets`
- Type: `Partial<XmlParseBudgets>`
- Default values:
  - `maxInputBytes`: `1_000_000`
  - `maxStreamBytes`: `1_000_000`
  - `maxNodes`: `50_000`
  - `maxDepth`: `256`
  - `maxAttributesPerElement`: `256`
  - `maxTextBytes`: `1_000_000`
  - `maxErrors`: `1_000`
  - `maxTimeMs`: `2_000`

Budget excess raises a structured parser budget error.

## Validation options (`validateXmlProfile`)

### `expectedRootQName`
- Expected QName for root element.

### `requiredElementQNames`
- Element QNames that must appear at least once.

### `requiredAttributesByElementQName`
- Map of required attribute names keyed by element QName.

### `maxOccurrencesByElementQName`
- Map of maximum allowed occurrences keyed by element QName.

Returns `XmlValidationResult` with `ok` and structured issues.

## Canonicalization and signature options

### `signCanonicalXml(input, privateKey, algorithm?)`
- `algorithm` defaults to `RSASSA-PKCS1-v1_5`.

### `verifyCanonicalXmlSignature(input, signature, publicKey, algorithm?)`
- Uses the same algorithm default.

## Related
- [API overview](./api-overview.md)
- [Data model](./data-model.md)
- [Error model](./error-model.md)
- [Canonicalization and signatures](./canonicalization.md)
