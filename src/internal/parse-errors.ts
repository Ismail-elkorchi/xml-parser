import type { XmlBudgetExceededDetails, XmlParseError } from "./types.js";

const XML_WELL_FORMED_SPEC_REF = "https://www.w3.org/TR/xml/#sec-well-formed";

export class XmlBudgetExceededError extends Error {
  readonly details: XmlBudgetExceededDetails;
  readonly parseErrorId = "budget-exceeded";

  constructor(details: XmlBudgetExceededDetails) {
    super(`Budget exceeded: ${details.budget} limit=${details.limit} observed=${details.observed}`);
    this.name = "XmlBudgetExceededError";
    this.details = details;
  }
}

export function getParseErrorSpecRef(parseErrorId: string): string {
  void parseErrorId;
  return XML_WELL_FORMED_SPEC_REF;
}

export function createParseError(parseErrorId: string, message: string, source: string, offset: number): XmlParseError {
  const boundedOffset = Math.max(0, Math.min(offset, source.length));
  let line = 1;
  let column = 1;

  for (let i = 0; i < boundedOffset; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
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
