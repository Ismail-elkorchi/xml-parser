export type XmlNodeKind = "document" | "element" | "text";

export interface XmlParseError {
  parseErrorId: string;
  message: string;
  offset: number;
}

export interface XmlNode {
  kind: XmlNodeKind;
  name?: string;
  value?: string;
  children?: XmlNode[];
}

export interface XmlDocument {
  kind: "document";
  source: string;
  root: XmlNode;
  errors: XmlParseError[];
}

export interface XmlParseOptions {
  strict?: boolean;
}
