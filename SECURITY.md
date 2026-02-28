# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | yes |
| `0.x` latest release line | yes |
| older `0.x` lines | no |

## Reporting a vulnerability

Report vulnerabilities with GitHub private vulnerability reporting for this repository.

- Private reporting entry point:
  `https://github.com/Ismail-elkorchi/xml-parser/security/advisories/new`

- Include reproduction input, expected behavior, and observed behavior.
- Include impact details (availability, integrity, confidentiality).
- Include runtime and version information.

Do not open public issues for unpatched vulnerabilities.

## Response expectations

- Initial triage response target: 3 business days.
- Reproduction and severity classification target: 7 business days.
- Fix plan or mitigation target: 14 business days for high/critical issues.

## Scope notes

- XML parser defaults disable DTD and external entities.
- Resource budget bypasses and parser crashes are in scope.
- Tooling-only findings that do not affect shipped behavior are triaged separately.
