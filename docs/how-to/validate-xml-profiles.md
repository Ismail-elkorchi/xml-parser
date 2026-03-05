# Validate XML Profiles

Goal: validate XML against expected root and required elements.

```ts
import { parseXml, validateXmlProfile } from "@ismail-elkorchi/xml-parser";

const document = parseXml("<invoice><line/></invoice>");
const result = validateXmlProfile(document, {
  expectedRootQName: "invoice",
  requiredElementQNames: ["line"]
});

console.log(result.ok);
```

Expected output:
- `true` when document structure satisfies the configured profile.
