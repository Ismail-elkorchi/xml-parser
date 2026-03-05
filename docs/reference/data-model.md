# Data Model

## Parse Output Shape

`parseXml`, `parseXmlBytes`, and `parseXmlStream` return an `XmlDocument`:
- `kind: "document"`
- `root: XmlElementNode | null`
- `errors: XmlParseError[]`
- `tokens: XmlToken[]`
- `determinismHash: string`

## Node Model

`XmlNode` is a union of:
- `XmlElementNode` (`kind: "element"`, `qName`, `attributes`, `children`, namespaces)
- `XmlTextNode` (`kind: "text"`, `value`)

Spans include source offsets and origin metadata.

## Traversal

Use query helpers for common tasks:
- `iterateElements`
- `findFirstElementByQName`
- `listElementsByQName`
- `listElementsByAttribute`
- `listElementsByNamespace`
- `listTextNodes`

## Serialization

`serializeXml(documentOrNode)` emits deterministic XML text from parsed structures.

## Errors And Budgets

- Non-fatal parse diagnostics are returned in `errors`.
- Budget violations throw `XmlBudgetExceededError` with budget name, limit, and observed value.
- Parse budgets are configurable through `XmlParseOptions.budgets`.

## Validation Model

`validateXmlProfile` returns:
- `ok: boolean`
- `issues: XmlValidationIssue[]`

Each issue includes stable `code` values and contextual fields.
