export type XmlNodeKind = "element" | "text";

/** Source interval associated with parsed XML data. */
export interface XmlSpan {
  /** Inclusive UTF-16 source offset. */
  start: number;
  /** Exclusive UTF-16 source offset. */
  end: number;
  /** Whether the interval came from input, recovery, or no source. */
  origin: "input" | "inferred" | "none";
}

/** Namespace-aware attribute attached to an element. */
export interface XmlAttribute {
  /** Qualified source name. */
  qName: string;
  /** Local name without a namespace prefix. */
  localName: string;
  /** Namespace prefix, when present. */
  prefix: string | null;
  /** Resolved namespace name, when present. */
  namespaceURI: string | null;
  /** Normalized attribute value. */
  value: string;
  /** Attribute source interval. */
  span: XmlSpan;
}

/** Parsed character-data node. */
export interface XmlTextNode {
  /** Text-node discriminator. */
  kind: "text";
  /** Deterministic document-local identifier. */
  nodeId: number;
  /** Normalized character data. */
  value: string;
  /** Character-data source interval. */
  span: XmlSpan;
}

/** Parsed namespace-aware XML element. */
export interface XmlElementNode {
  /** Element-node discriminator. */
  kind: "element";
  /** Deterministic document-local identifier. */
  nodeId: number;
  /** Qualified source name. */
  qName: string;
  /** Local name without a namespace prefix. */
  localName: string;
  /** Namespace prefix, when present. */
  prefix: string | null;
  /** Resolved namespace name, when present. */
  namespaceURI: string | null;
  /** Attributes in source order. */
  attributes: XmlAttribute[];
  /** Child elements and text nodes in source order. */
  children: XmlNode[];
  /** Complete element source interval. */
  span: XmlSpan;
  /** Start-tag source interval. */
  startTagSpan: XmlSpan;
  /** End-tag interval, or `null` before recovery closes the element. */
  endTagSpan: XmlSpan | null;
}

/** Element or character-data node in a parsed XML tree. */
export type XmlNode = XmlElementNode | XmlTextNode;

/** Deterministic XML well-formedness diagnostic. */
export interface XmlParseError {
  /** Stable machine-readable diagnostic identifier. */
  parseErrorId: string;
  /** Human-readable diagnostic description. */
  message: string;
  /** UTF-16 source offset. */
  offset: number;
  /** One-based source line. */
  line: number;
  /** One-based source column. */
  column: number;
  /** Diagnostic severity. */
  severity: "error";
}

/** Attribute data carried by a lexical start-tag token. */
export interface XmlTokenAttribute {
  /** Qualified attribute name. */
  qName: string;
  /** Normalized attribute value. */
  value: string;
  /** Attribute source interval. */
  span: XmlSpan;
}

/** Lexical token produced by XML tokenization. */
export type XmlToken =
  | {
      kind: "xml-declaration";
      raw: string;
      start: number;
      end: number;
      encoding: string | null;
      version: string | null;
      standalone: "yes" | "no" | null;
    }
  | {
      kind: "start-tag";
      qName: string;
      attributes: XmlTokenAttribute[];
      selfClosing: boolean;
      start: number;
      end: number;
    }
  | {
      kind: "end-tag";
      qName: string;
      start: number;
      end: number;
    }
  | {
      kind: "text";
      value: string;
      start: number;
      end: number;
    }
  | {
      kind: "comment";
      value: string;
      start: number;
      end: number;
    }
  | {
      kind: "cdata";
      value: string;
      start: number;
      end: number;
    }
  | {
      kind: "doctype";
      value: string;
      start: number;
      end: number;
    }
  | {
      kind: "processing-instruction";
      value: string;
      start: number;
      end: number;
    };

/** Complete set of XML parser resource limits. */
export interface XmlParseBudgets {
  /** Maximum bytes accepted from any input form. */
  maxInputBytes: number;
  /** Maximum bytes consumed specifically from a stream. */
  maxStreamBytes: number;
  /** Maximum element and text node count. */
  maxNodes: number;
  /** Maximum open-element nesting depth. */
  maxDepth: number;
  /** Maximum attribute count on one element. */
  maxAttributesPerElement: number;
  /** Maximum accumulated UTF-8 text bytes. */
  maxTextBytes: number;
  /** Maximum diagnostics before a budget exception. */
  maxErrors: number;
  /** Maximum end-to-end parse duration in milliseconds. */
  maxTimeMs: number;
}

/** Resource limits accepted by XML parse entrypoints. */
export interface XmlParseOptions {
  /** Overrides for default parser budgets. */
  budgets?: Partial<XmlParseBudgets>;
}

export type XmlReplayEvent =
  | {
      seq: number;
      kind: "token";
      tokenKind: XmlToken["kind"];
      qName: string | null;
      start: number;
      end: number;
    }
  | {
      seq: number;
      kind: "parse-error";
      parseErrorId: string;
      offset: number;
      line: number;
      column: number;
    }
  | {
      seq: number;
      kind: "tree-node";
      nodeKind: XmlNodeKind;
      nodeId: number;
      qName: string | null;
      spanStart: number;
      spanEnd: number;
    }
  | {
      seq: number;
      kind: "summary";
      nodeCount: number;
      tokenCount: number;
      parseErrorCount: number;
      determinismHash: string;
      truncated: boolean;
    };

export interface XmlReplayContract {
  contract: "xml-replay-v2";
  sourceKind: "string" | "bytes" | "document";
  inputHash: string;
  optionsHash: string;
  determinismHash: string;
  events: XmlReplayEvent[];
  truncated: boolean;
  replayHash: string;
}

export interface XmlReplayOptions {
  parse?: XmlParseOptions;
  maxEvents?: number;
}

export type XmlReplayInput = string | Uint8Array | XmlDocument;

export interface XmlReplayVerificationResult {
  ok: boolean;
  expectedReplayHash: string;
  observedReplayHash: string;
  mismatch: "replay-hash-mismatch" | null;
}

/** Parsed XML document, lexical tokens, and diagnostics. */
export interface XmlDocument {
  /** Document discriminator. */
  kind: "document";
  /** Normalized source, or `null` for stream parsing. */
  source: string | null;
  /** Parsed document element, when available. */
  root: XmlElementNode | null;
  /** XML well-formedness and policy diagnostics. */
  errors: XmlParseError[];
  /** Lexical token sequence. */
  tokens: XmlToken[];
  /** Stable hash of tree, tokens, and diagnostics. */
  determinismHash: string;
}
