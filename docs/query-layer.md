# Query Layer

Deterministic query helpers operate on `XmlDocument` or any `XmlElementNode` subtree.

## API
- `iterateElements(input)`
- `findFirstElementByQName(input, qName)`
- `listElementsByQName(input, qName)`
- `listElementsByAttribute(input, qName, value?)`
- `listElementsByNamespace(input, namespaceURI, localName?)`
- `listTextNodes(input)`

## Determinism contract
- Traversal order is depth-first pre-order.
- Match lists preserve traversal order.
- Repeated calls on equivalent parse output must produce equal node ID sequences.

## Scope boundaries
- No CSS selectors.
- No XPath/XQuery.
- No mutation side effects.
