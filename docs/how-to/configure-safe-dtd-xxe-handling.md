# Configure Safe DTD And XXE Handling

Goal: verify that DTD and external entities stay blocked for untrusted input.

```ts
import { parseXml } from "@ismail-elkorchi/xml-parser";

const untrusted = `
<!DOCTYPE root [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>
`;

const document = parseXml(untrusted, {
  strict: true,
  budgets: {
    maxInputBytes: 16_384,
    maxNodes: 1_024,
    maxDepth: 64,
    maxErrors: 16
  }
});

const errorIds = document.errors.map((error) => error.parseErrorId);
console.log(errorIds.includes("disallowed-dtd"));
console.log(errorIds.includes("disallowed-external-entity"));
```

Expected output:
- `true`
- `true`
