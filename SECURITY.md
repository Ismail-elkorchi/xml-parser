# Security policy

Security fixes target `main` and the latest published `0.x` line. Older pre-1.0 releases are not maintained.

Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/Ismail-elkorchi/xml-parser/security/advisories/new). Include the smallest reproducer you can share, affected package and runtime versions, observed impact, and any relevant resource limits.

## Untrusted XML

DTD processing is disabled. Document-type and entity declarations produce `disallowed-dtd`; external resources and document-defined entities are never resolved. Only predefined XML entities and numeric character references are decoded.

Well-formedness diagnostics do not throw by default. Applications that require valid XML must reject a non-empty `document.errors` array. Set limits for input bytes, stream bytes, nodes, depth, attributes, text, diagnostics, and elapsed work according to the application’s expected documents.

The parser is not an authorization, sanitization, schema-validation, canonicalization, or signature-verification boundary. Validate parsed data for the application’s own trust model.

Security-relevant changes should pass `npm run qualification:ci`; release qualification additionally runs an independent parser comparison.
