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
  allowDtd?: boolean;
  allowExternalEntities?: boolean;
  budgets?: Partial<XmlParseBudgets>;
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
