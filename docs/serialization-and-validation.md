# Serialization and validation

## Serialization

`serializeXml()` accepts an error-free `XmlDocument` or a complete `XmlNode`. It validates caller-constructed trees before producing output, including qualified names, namespace metadata and bindings, duplicate attributes, XML characters, and graph ownership.

```ts
import { parseXml, serializeXml } from "@ismail-elkorchi/xml-parser";

const document = parseXml('<root note="a&#xA;b">x &amp; y</root>');
if (document.errors.length > 0) throw new Error("Malformed XML");

const xml = serializeXml(document);
```

Text and attribute escaping preserves XML character-reference values across a parse/serialize/parse round trip. Empty elements use `<name/>` syntax.

Serialization operates on the retained element-and-text tree. It does not restore an XML declaration, comments, processing instructions, DTDs, entity spelling, CDATA boundaries, quote style, or other lexical choices. It is not W3C Canonical XML and must not be used as a signature canonicalization algorithm.

Parsed documents with diagnostics are rejected. Caller-constructed nodes must provide internally consistent `qName`, `localName`, `prefix`, and `namespaceURI` fields plus valid namespace declarations.

## Structural profiles

`validateXmlProfile()` applies a small set of qualified-name constraints after parsing:

```ts
import { parseXml, validateXmlProfile } from "@ismail-elkorchi/xml-parser";

const document = parseXml('<invoice><line amount="10"/></invoice>');
const result = validateXmlProfile(document, {
  expectedRootQName: "invoice",
  requiredElementQNames: ["line"],
  requiredAttributesByElementQName: { line: ["amount"] },
  maxOccurrencesByElementQName: { line: 100 }
});
```

Profiles use exact qualified names, not namespace URI/local-name pairs. They are application-level presence and occurrence checks, not XSD or another schema language. Validate `document.errors` before relying on a profile result.
