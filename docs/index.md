# Documentation

Start with the [README](../README.md) for installation and a complete first parse.

- [Parsing, diagnostics, and budgets](./parsing.md) explains the string, byte, stream, and tokenizer APIs.
- [Tree model and queries](./data-model.md) describes retained nodes, namespaces, source spans, and traversal helpers.
- [Serialization and validation](./serialization-and-validation.md) covers safe serialization and qualified-name profiles.
- [Development and releases](./development.md) explains the source layout and verification commands.

## Scope

The package implements the XML 1.0 Fifth Edition syntax and Namespaces in XML 1.0 constraints needed by its element-and-text tree model. It has no runtime dependencies and runs without Node.js built-ins.

DTD processing is deliberately outside the package. A document-type or entity declaration produces `disallowed-dtd`; document-defined and external entities are never resolved. The package is also not a DOM, XSD validator, canonical XML implementation, or XML Signature implementation.

The relevant standards are [XML 1.0 Fifth Edition](https://www.w3.org/TR/xml/) and [Namespaces in XML 1.0 Third Edition](https://www.w3.org/TR/xml-names/).
