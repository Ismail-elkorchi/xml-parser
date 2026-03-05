# Security Posture

Security defaults are conservative:
- DTD and external entity behavior are restricted.
- Parse budgets are first-class controls.
- Parser APIs do not execute scripts or fetch remote resources.

For untrusted input, keep strict mode enabled and always configure budgets.
