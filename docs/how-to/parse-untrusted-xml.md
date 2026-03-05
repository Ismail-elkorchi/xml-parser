# Parse Untrusted XML Safely

Goal: parse unknown XML input with deterministic limits.

```ts
import { XmlBudgetExceededError, parseXml } from "@ismail-elkorchi/xml-parser";

const input = "<a>".repeat(40_000);

try {
  const document = parseXml(input, {
    budgets: {
      maxInputBytes: 64_000,
      maxNodes: 8_000,
      maxDepth: 128
    }
  });

  console.log(document.kind);
} catch (error) {
  if (error instanceof XmlBudgetExceededError) {
    console.log(error.payload.code, error.payload.budget);
  } else {
    throw error;
  }
}
```

Expected output:
- Deterministic parse success or a structured budget exception.
