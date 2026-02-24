# Parse Error Taxonomy

## Stable contract
- Every parser-reported error includes:
  - `parseErrorId`
  - `message`
  - `offset`
  - `line`
  - `column`
  - `severity`

## Error IDs in current profile
- `budget-exceeded`
- `disallowed-dtd`
- `disallowed-external-entity`
- `duplicate-attribute`
- `malformed-attribute`
- `malformed-cdata`
- `malformed-comment`
- `malformed-declaration`
- `malformed-end-tag`
- `malformed-processing-instruction`
- `malformed-start-tag`
- `mismatched-end-tag`
- `multiple-root-elements`
- `namespace-prefix-redefined`
- `namespace-prefix-undefined`
- `no-root-element`
- `text-outside-root`
- `undefined-entity`
- `unexpected-end-tag`
- `unclosed-tag`
- `unsupported-declaration`
- `unsupported-processing-instruction`
- `xml-declaration-not-at-start`

## Spec reference helper
- `getParseErrorSpecRef(parseErrorId)` returns:
  - `https://www.w3.org/TR/xml/#sec-well-formed`
