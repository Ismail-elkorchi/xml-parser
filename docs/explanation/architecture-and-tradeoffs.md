# Architecture and Tradeoffs

`xml-parser` prioritizes deterministic parsing, explicit security defaults, and replayable diagnostics.

## Core architecture
- Public surface in `src/mod.ts` and `src/public/*`.
- Internal parser/tokenizer/serializer modules in `src/internal/*`.
- No runtime dependencies in production package path.

## Design priorities
1. Deterministic output and parse-error taxonomy.
2. Security defaults aligned to XML threat classes.
3. Cross-runtime portability (Node, Deno, Bun, browser smoke lane).
4. Evidence-backed release checks.

## Tradeoffs
- Not a DOM implementation.
- Not an XPath/XQuery runtime.
- Not schema inference; validation is profile-driven and explicit.
