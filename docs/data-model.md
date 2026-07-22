# Tree model and queries

`XmlDocument.root` is an `XmlElementNode | null`. Element children are `XmlElementNode` or `XmlTextNode`; comments, processing instructions, declarations, and DTDs are not retained.

Elements and attributes expose:

- `qName`: the source qualified name, such as `atom:entry`;
- `localName`: the component after the prefix;
- `prefix`: the prefix or `null`;
- `namespaceURI`: the resolved URI or `null`;
- `span`: offsets in normalized source text.

Unprefixed attributes do not inherit the default namespace. Namespace declaration attributes use the XMLNS namespace URI. Node IDs are unique within one parsed document and are intended for correlating results from that document, not as persistent identifiers.

The complete public result is readonly in TypeScript. Build application-specific mutable data separately instead of mutating parsed nodes.

## Query helpers

```ts
import {
  listElementsByAttribute,
  listElementsByNamespace,
  listTextNodes,
  parseXml
} from "@ismail-elkorchi/xml-parser";

const document = parseXml(`
  <feed xmlns="urn:feed">
    <entry id="one">First</entry>
    <entry id="two">Second</entry>
  </feed>
`);

const entries = listElementsByNamespace(document, "urn:feed", "entry");
const selected = listElementsByAttribute(document, "id", "two");
const text = listTextNodes(document).map((node) => node.value);
```

`iterateElements()` and all list helpers use depth-first document order. Qualified-name helpers compare exact `qName` strings; namespace helpers compare resolved namespace URIs and local names.

Query helpers validate JavaScript arguments and caller-supplied tree structure. Invalid values and cyclic or shared element graphs throw `XmlConfigurationError` rather than producing partial results or generic property-access errors.
