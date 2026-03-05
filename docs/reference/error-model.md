# Error Model

## `XmlBudgetExceededError`

Thrown when configured limits are exceeded.

Payload fields:
- `code`: `"BUDGET_EXCEEDED"`
- `budget`: which limit failed
- `limit`: configured value
- `actual`: observed value

## Parse errors

Parse APIs return deterministic parse errors with stable `parseErrorId` values.
Use `getParseErrorSpecRef(parseErrorId)` for a stable spec reference.

Common parse-error categories include malformed tags, invalid attribute syntax, and unbalanced structures.
Example stable parse-error id: `mismatched-end-tag`.
