# xml-parser

Deterministic, agent-first XML parser for Node, Deno, Bun, and modern browsers.

## Status
- Early bootstrap.
- Runtime dependencies are intentionally empty.
- ESM-only package surface.

## Goals
- Deterministic parse output and error taxonomy.
- Security-first defaults for XML threat classes.
- Streaming support with bounded resource budgets.

## Non-goals (current)
- Browser DOM implementation.
- XPath/XQuery execution engine.
- Automatic schema validation in parser core.

## Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run eval:ci`
- `npm run eval:release`
