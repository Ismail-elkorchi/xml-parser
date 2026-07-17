import type { XmlParseBudgets, XmlParseError } from "./types.js";

const XML_WELL_FORMED_SPEC_REF = "https://www.w3.org/TR/xml/#sec-well-formed";

/**
 * Represents a structured public error for `XmlBudgetExceededError` failure cases.
 */


export class XmlBudgetExceededError extends Error {
  /** Stable budget-error code. */
  readonly code = "BUDGET_EXCEEDED";
  /** Stable parse taxonomy identifier. */
  readonly parseErrorId = "budget-exceeded";
  /** Resource limit that was exceeded. */
  readonly budget: keyof XmlParseBudgets;
  /** Configured resource limit. */
  readonly limit: number;
  /** Observed resource use. */
  readonly actual: number;

  /** Creates a structured resource-limit exception. */
  constructor(budget: keyof XmlParseBudgets, limit: number, actual: number) {
    super(`Budget exceeded: ${budget} limit=${limit} actual=${actual}`);
    this.name = "XmlBudgetExceededError";
    this.budget = budget;
    this.limit = limit;
    this.actual = actual;
  }
}

/**
 * Represents invalid UTF-8 input supplied to a byte-oriented XML API.
 */


export class XmlDecodingError extends Error {
  /** Stable byte-decoding error code. */
  readonly code = "INVALID_UTF8";
  /** Required byte encoding for byte and stream APIs. */
  readonly encoding = "utf-8";

  /** Creates an invalid UTF-8 exception. */
  constructor() {
    super("XML byte input is not valid UTF-8");
    this.name = "XmlDecodingError";
  }
}

/**
 * Returns deterministic public metadata for `getParseErrorSpecRef`.
 */


export function getParseErrorSpecRef(parseErrorId: string): string {
  void parseErrorId;
  return XML_WELL_FORMED_SPEC_REF;
}

export function createParseError(
  parseErrorId: string,
  message: string,
  source: string,
  offset: number,
  checkWork?: () => void
): XmlParseError {
  const boundedOffset = source.length > 0
    ? Math.max(0, Math.min(offset, source.length))
    : Math.max(0, offset);
  let line = 1;
  let column = 1;

  if (source.length > 0) {
    for (let i = 0; i < Math.min(boundedOffset, source.length); i += 1) {
      if ((i & 1023) === 0) {
        checkWork?.();
      }
      if (source.charCodeAt(i) === 10) {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
    }
  } else {
    column = boundedOffset + 1;
  }

  return {
    parseErrorId,
    message,
    offset: boundedOffset,
    line,
    column,
    severity: "error"
  };
}
