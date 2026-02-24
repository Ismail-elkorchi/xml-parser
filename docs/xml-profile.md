# XML Profile

## Supported profile
- XML 1.0 well-formed document parsing for:
  - element start/end tags
  - empty-element tags
  - attributes with quoted values
  - text nodes and CDATA sections
  - namespace declarations (`xmlns`, `xmlns:prefix`)
  - XML declaration token capture

## Explicit exclusions
- DTD processing is disabled by default.
- External entity resolution is disabled by default.
- Processing instructions beyond XML declaration are treated as unsupported.
- No XPath/XQuery execution.
- No schema validation.

## Parser contracts
- Deterministic output shape and `determinismHash` for stable input/options.
- Stable parse error IDs under malformed inputs.
- Structured budget failures with `XmlBudgetExceededError`.
