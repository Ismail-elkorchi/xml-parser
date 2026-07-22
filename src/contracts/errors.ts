import type { XmlParseBudgets, XmlParseErrorId } from "./types.ts";

const XML_DOCUMENT_REF = "https://www.w3.org/TR/xml/#sec-well-formed";
const XML_CHARACTER_REF = "https://www.w3.org/TR/xml/#charsets";
const XML_REFERENCE_REF = "https://www.w3.org/TR/xml/#sec-references";
const XML_DECLARATION_REF = "https://www.w3.org/TR/xml/#sec-prolog-dtd";
const XML_NAMESPACES_REF = "https://www.w3.org/TR/xml-names/";

/** Error codes for invalid public API configuration. */
export type XmlConfigurationErrorCode =
  | "INVALID_ARGUMENT"
  | "INVALID_BUDGET"
  | "INVALID_PROFILE"
  | "INVALID_TREE";

/** Represents an invalid parser option, API argument, validation profile, or node tree. */
export class XmlConfigurationError extends TypeError {
  /** Stable machine-readable error code. */
  readonly code: XmlConfigurationErrorCode;
  /** Property path at which validation failed. */
  readonly path: string;

  /** Creates a configuration error for one invalid public input. */
  constructor(code: XmlConfigurationErrorCode, path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "XmlConfigurationError";
    this.code = code;
    this.path = path;
  }
}

/** Represents a parser resource limit exceeded by observed work. */
export class XmlBudgetExceededError extends Error {
  /** Stable machine-readable error code. */
  readonly code = "BUDGET_EXCEEDED";
  /** Resource limit that was exceeded. */
  readonly budget: keyof XmlParseBudgets;
  /** Configured maximum value. */
  readonly limit: number;
  /** Observed value that exceeded the limit. */
  readonly actual: number;

  /** Creates an error describing one exceeded resource limit. */
  constructor(budget: keyof XmlParseBudgets, limit: number, actual: number) {
    super(`Budget exceeded: ${budget} limit=${String(limit)} actual=${String(actual)}`);
    this.name = "XmlBudgetExceededError";
    this.budget = budget;
    this.limit = limit;
    this.actual = actual;
  }
}

/** Represents invalid or unsupported byte encoding supplied to a byte API. */
export class XmlDecodingError extends Error {
  /** Stable machine-readable decoding error code. */
  readonly code: "INVALID_UTF8" | "UNSUPPORTED_XML_ENCODING";
  /** Encoding associated with the failure. */
  readonly encoding: string;

  /** Creates a decoding error for invalid UTF-8 or an unsupported declaration. */
  constructor(code: "INVALID_UTF8" | "UNSUPPORTED_XML_ENCODING", encoding: string) {
    const message = code === "INVALID_UTF8"
      ? "XML byte input is not valid UTF-8"
      : `XML byte input declares unsupported encoding: ${encoding}`;
    super(message);
    this.name = "XmlDecodingError";
    this.code = code;
    this.encoding = encoding;
  }
}

/** Returns the normative specification section for a parser diagnostic, when applicable. */
export function getParseErrorSpecRef(parseErrorId: XmlParseErrorId): string | null;
export function getParseErrorSpecRef(parseErrorId: string): string | null {
  switch (parseErrorId) {
    case "invalid-xml-character":
      return XML_CHARACTER_REF;
    case "invalid-character-reference":
    case "malformed-entity-reference":
    case "undefined-entity":
      return XML_REFERENCE_REF;
    case "malformed-qualified-name":
    case "duplicate-expanded-attribute":
    case "namespace-name-reserved":
    case "namespace-prefix-reserved":
    case "namespace-prefix-undeclared":
    case "namespace-prefix-undefined":
      return XML_NAMESPACES_REF;
    case "malformed-xml-declaration":
    case "reserved-processing-instruction-target":
    case "xml-declaration-not-at-start":
      return XML_DECLARATION_REF;
    case "disallowed-dtd":
      return null;
    case "cdata-close-in-character-data":
    case "cdata-outside-root":
    case "duplicate-attribute":
    case "less-than-in-attribute-value":
    case "malformed-attribute":
    case "malformed-cdata":
    case "malformed-comment":
    case "malformed-declaration":
    case "malformed-end-tag":
    case "malformed-processing-instruction":
    case "malformed-start-tag":
    case "malformed-tag":
    case "mismatched-end-tag":
    case "multiple-root-elements":
    case "no-root-element":
    case "text-outside-root":
    case "unclosed-tag":
    case "unexpected-end-tag":
      return XML_DOCUMENT_REF;
    default:
      throw new XmlConfigurationError("INVALID_ARGUMENT", "parseErrorId", "is not a recognized XML diagnostic");
  }
}
