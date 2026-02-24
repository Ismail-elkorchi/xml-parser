# Schema Validation Profile

`validateXmlProfile` provides deterministic profile-based checks on parsed XML trees.

## API
- `validateXmlProfile(input, profile)`

## Profile fields
- `expectedRootQName`
- `requiredElementQNames`
- `requiredAttributesByElementQName`
- `maxOccurrencesByElementQName`

## Result contract
- `ok: boolean`
- `issues: XmlValidationIssue[]`

Issue codes:
- `root-qname-mismatch`
- `missing-element`
- `missing-attribute`
- `max-occurrences-exceeded`
- `no-root`

## Scope boundaries
- This is not full XSD validation.
- This profile layer is deterministic and intended for gateable extraction contracts.
