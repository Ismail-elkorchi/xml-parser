# Design Constraints and Non-goals

## Constraints
- Determinism and explicit failure modes are preferred over permissive recovery.
- XML security defaults stay conservative (no external entity resolution).
- Budget controls must remain available across all supported runtimes.

## Non-goals
- Full schema/XSD execution in the parser core.
- DTD/external entity processing convenience modes.
- Browser DOM API emulation.
