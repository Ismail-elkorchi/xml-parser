# ADR-001: XML profile and security defaults

## Status
Accepted

## Context
`xml-parser` targets deterministic, agent-first XML parsing on untrusted input.
Unbounded or network-resolving XML features create high-risk failure classes.

## Decision
- Support a strict XML profile focused on well-formed document parsing.
- Disable DTD and external entities by default.
- Parser policy statement: disable DTD unless explicitly opted in.
- Require explicit opt-in flags for risky XML declarations.
- Enforce hard parser budgets with structured budget-failure errors.

## Consequences
- Some XML documents using DTD/entity expansion are rejected by default.
- Consumers must explicitly opt in and own additional risk controls.
- Deterministic failure handling is preserved across runtimes.
