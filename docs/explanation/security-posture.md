# Security Posture

Security defaults are conservative:
- DTD and external entity behavior are restricted.
- Parse budgets are first-class controls.
- Parser APIs do not execute scripts or fetch remote resources.

XML 1.0 well-formedness is unconditional. For untrusted input, always configure
budgets and reject documents that contain parse diagnostics.
