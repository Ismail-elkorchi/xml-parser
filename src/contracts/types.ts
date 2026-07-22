/** Kinds of nodes retained in the parsed XML tree. */
export type XmlNodeKind = "element" | "text";

/** Stable identifiers for XML syntax, namespace, and parser-policy diagnostics. */
export type XmlParseErrorId =
  | "cdata-close-in-character-data"
  | "cdata-outside-root"
  | "disallowed-dtd"
  | "duplicate-attribute"
  | "duplicate-expanded-attribute"
  | "invalid-character-reference"
  | "invalid-xml-character"
  | "less-than-in-attribute-value"
  | "malformed-attribute"
  | "malformed-cdata"
  | "malformed-comment"
  | "malformed-declaration"
  | "malformed-end-tag"
  | "malformed-entity-reference"
  | "malformed-processing-instruction"
  | "malformed-qualified-name"
  | "malformed-start-tag"
  | "malformed-tag"
  | "malformed-xml-declaration"
  | "mismatched-end-tag"
  | "multiple-root-elements"
  | "namespace-name-reserved"
  | "namespace-prefix-reserved"
  | "namespace-prefix-undeclared"
  | "namespace-prefix-undefined"
  | "no-root-element"
  | "reserved-processing-instruction-target"
  | "text-outside-root"
  | "unclosed-tag"
  | "undefined-entity"
  | "unexpected-end-tag"
  | "xml-declaration-not-at-start";

/** Source interval associated with parsed XML data. */
export interface XmlSpan {
  /** Inclusive UTF-16 offset in the normalized source. */
  readonly start: number;
  /** Exclusive UTF-16 offset in the normalized source. */
  readonly end: number;
  /** Whether the interval came from input or parser recovery. */
  readonly origin: "input" | "inferred";
}

/** Namespace-aware attribute attached to an element. */
export interface XmlAttribute {
  /** Qualified name as written in the source. */
  readonly qName: string;
  /** Name component after any namespace prefix. */
  readonly localName: string;
  /** Namespace prefix, or `null` for an unprefixed attribute. */
  readonly prefix: string | null;
  /** Resolved namespace URI, or `null` when the attribute is not namespaced. */
  readonly namespaceURI: string | null;
  /** Decoded attribute value. */
  readonly value: string;
  /** Source interval containing the complete attribute. */
  readonly span: XmlSpan;
}

/** Parsed character-data node. */
export interface XmlTextNode {
  /** Discriminant for character-data nodes. */
  readonly kind: "text";
  /** Identifier unique within the containing parsed document. */
  readonly nodeId: number;
  /** Decoded character data. */
  readonly value: string;
  /** Source interval that produced the node. */
  readonly span: XmlSpan;
}

/** Parsed namespace-aware XML element. */
export interface XmlElementNode {
  /** Discriminant for element nodes. */
  readonly kind: "element";
  /** Identifier unique within the containing parsed document. */
  readonly nodeId: number;
  /** Qualified name as written in the source. */
  readonly qName: string;
  /** Name component after any namespace prefix. */
  readonly localName: string;
  /** Namespace prefix, or `null` for an unprefixed element. */
  readonly prefix: string | null;
  /** Resolved namespace URI, or `null` when no default namespace applies. */
  readonly namespaceURI: string | null;
  /** Attributes in source order. */
  readonly attributes: readonly XmlAttribute[];
  /** Child elements and character-data nodes in document order. */
  readonly children: readonly XmlNode[];
  /** Source interval containing the complete element. */
  readonly span: XmlSpan;
  /** Source interval containing the start tag. */
  readonly startTagSpan: XmlSpan;
  /** Source interval containing the end tag, or `null` for an empty-element tag. */
  readonly endTagSpan: XmlSpan | null;
}

/** Element or character-data node in a parsed XML tree. */
export type XmlNode = XmlElementNode | XmlTextNode;

/** One deterministic XML diagnostic. */
export interface XmlParseError {
  /** Stable machine-readable diagnostic identifier. */
  readonly parseErrorId: XmlParseErrorId;
  /** Human-readable explanation of the error. */
  readonly message: string;
  /** Zero-based UTF-16 offset in the normalized source. */
  readonly offset: number;
  /** One-based source line. */
  readonly line: number;
  /** One-based UTF-16 source column. */
  readonly column: number;
  /** Diagnostic severity; malformed XML always produces an error. */
  readonly severity: "error";
}

/** Attribute data carried by a lexical start-tag token. */
export interface XmlTokenAttribute {
  /** Qualified attribute name. */
  readonly qName: string;
  /** Decoded attribute value. */
  readonly value: string;
  /** Source interval containing the complete attribute. */
  readonly span: XmlSpan;
}

/** Lexical token produced by XML tokenization. */
export type XmlToken =
  | {
      /** XML declaration token discriminant. */
      readonly kind: "xml-declaration";
      /** Complete declaration text. */
      readonly raw: string;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
      /** Declared encoding, when present. */
      readonly encoding: string | null;
      /** Declared XML version, when present. */
      readonly version: string | null;
      /** Declared standalone value, when present. */
      readonly standalone: "yes" | "no" | null;
    }
  | {
      /** Start-tag token discriminant. */
      readonly kind: "start-tag";
      /** Qualified element name. */
      readonly qName: string;
      /** Lexical attributes in source order. */
      readonly attributes: readonly XmlTokenAttribute[];
      /** Whether the token uses empty-element syntax. */
      readonly selfClosing: boolean;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
    }
  | {
      /** End-tag token discriminant. */
      readonly kind: "end-tag";
      /** Qualified element name. */
      readonly qName: string;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
    }
  | {
      /** Character-data token discriminant. */
      readonly kind: "text";
      /** Decoded character data. */
      readonly value: string;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
    }
  | {
      /** Comment token discriminant. */
      readonly kind: "comment";
      /** Comment content without delimiters. */
      readonly value: string;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
    }
  | {
      /** CDATA token discriminant. */
      readonly kind: "cdata";
      /** CDATA content without delimiters. */
      readonly value: string;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
    }
  | {
      /** Document-type token discriminant. */
      readonly kind: "doctype";
      /** Complete document-type declaration. */
      readonly value: string;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
    }
  | {
      /** Processing-instruction token discriminant. */
      readonly kind: "processing-instruction";
      /** Processing-instruction content without delimiters. */
      readonly value: string;
      /** Inclusive UTF-16 source offset. */
      readonly start: number;
      /** Exclusive UTF-16 source offset. */
      readonly end: number;
    };

/** Tokens and diagnostics produced by the standalone tokenizer. */
export interface XmlTokenizationResult {
  /** Lexical tokens in source order. */
  readonly tokens: readonly XmlToken[];
  /** Diagnostics encountered while tokenizing. */
  readonly errors: readonly XmlParseError[];
}

/** Complete set of parser resource limits. */
export interface XmlParseBudgets {
  /** Maximum UTF-8 byte length accepted by string and byte entrypoints. */
  readonly maxInputBytes: number;
  /** Maximum bytes read from the stream entrypoint. */
  readonly maxStreamBytes: number;
  /** Maximum retained element and text node count. */
  readonly maxNodes: number;
  /** Maximum element nesting depth. */
  readonly maxDepth: number;
  /** Maximum attributes accepted on one element. */
  readonly maxAttributesPerElement: number;
  /** Maximum cumulative UTF-8 bytes retained as text. */
  readonly maxTextBytes: number;
  /** Maximum diagnostics retained in the result. */
  readonly maxErrors: number;
  /** Maximum elapsed parsing time in milliseconds. */
  readonly maxTimeMs: number;
}

/** Resource limits accepted by document parsing entrypoints. */
export interface XmlParseOptions {
  /** Overrides for the default resource limits. */
  readonly budgets?: Partial<XmlParseBudgets>;
}

/** Resource limits that apply to standalone tokenization. */
export type XmlTokenizeBudgets = Pick<
  XmlParseBudgets,
  "maxInputBytes" | "maxAttributesPerElement" | "maxErrors" | "maxTimeMs"
>;

/** Resource limits accepted by `tokenizeXml()`. */
export interface XmlTokenizeOptions {
  /** Overrides for the default standalone tokenizer limits. */
  readonly budgets?: Partial<XmlTokenizeBudgets>;
}

/** Parsed XML document and diagnostics. */
export interface XmlDocument {
  /** Document discriminant. */
  readonly kind: "document";
  /** Normalized source text, or `null` when parsing a stream. */
  readonly source: string | null;
  /** Parsed document element, when one was found. */
  readonly root: XmlElementNode | null;
  /** Well-formedness, namespace, and parser-policy diagnostics. */
  readonly errors: readonly XmlParseError[];
}
