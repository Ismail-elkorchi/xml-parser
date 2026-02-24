export type XmlNodeKind = "element" | "text";

export interface XmlSpan {
  start: number;
  end: number;
  origin: "input" | "inferred" | "none";
}

export interface XmlAttribute {
  qName: string;
  localName: string;
  prefix: string | null;
  namespaceURI: string | null;
  value: string;
  span: XmlSpan;
}

export interface XmlTextNode {
  kind: "text";
  nodeId: number;
  value: string;
  span: XmlSpan;
}

export interface XmlElementNode {
  kind: "element";
  nodeId: number;
  qName: string;
  localName: string;
  prefix: string | null;
  namespaceURI: string | null;
  attributes: XmlAttribute[];
  children: XmlNode[];
  span: XmlSpan;
  startTagSpan: XmlSpan;
  endTagSpan: XmlSpan | null;
}

export type XmlNode = XmlElementNode | XmlTextNode;

export interface XmlParseError {
  parseErrorId: string;
  message: string;
  offset: number;
  line: number;
  column: number;
  severity: "error";
}

export interface XmlTokenAttribute {
  qName: string;
  value: string;
  span: XmlSpan;
}

export type XmlToken =
  | {
      kind: "xml-declaration";
      raw: string;
      start: number;
      end: number;
      encoding: string | null;
      version: string | null;
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

export interface XmlParseBudgets {
  maxInputBytes: number;
  maxStreamBytes: number;
  maxNodes: number;
  maxDepth: number;
  maxAttributesPerElement: number;
  maxTextBytes: number;
  maxErrors: number;
  maxTimeMs: number;
}

export interface XmlParseOptions {
  strict?: boolean;
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
  contract: "xml-replay-v1";
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

export interface XmlDocument {
  kind: "document";
  source: string | null;
  root: XmlElementNode | null;
  errors: XmlParseError[];
  tokens: XmlToken[];
  determinismHash: string;
}

export interface XmlBudgetExceededDetails {
  budget: keyof XmlParseBudgets;
  limit: number;
  observed: number;
}
