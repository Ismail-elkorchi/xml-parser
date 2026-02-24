import { getParseErrorSpecRef, XmlBudgetExceededError } from "./internal/parse-errors.js";
import { parseXmlBytesSource, parseXmlSource, parseXmlStreamSource } from "./internal/parser.js";
import { serializeXmlDocument } from "./internal/serializer.js";
import { tokenizeXml as tokenize } from "./internal/tokenizer.js";
import {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  listTextNodes
} from "./public/query.js";
import type { XmlDocument, XmlNode, XmlParseOptions, XmlToken } from "./public/types.js";

export type {
  XmlAttribute,
  XmlBudgetExceededDetails,
  XmlDocument,
  XmlElementNode,
  XmlNode,
  XmlParseBudgets,
  XmlParseError,
  XmlParseOptions,
  XmlSpan,
  XmlTextNode,
  XmlToken
} from "./public/types.js";

export { XmlBudgetExceededError, getParseErrorSpecRef };
export {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  listTextNodes
};

export function parseXml(input: string, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlSource(input, options);
}

export function parseXmlBytes(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlBytesSource(input, options);
}

export async function parseXmlStream(
  stream: ReadableStream<Uint8Array>,
  options: XmlParseOptions = {}
): Promise<XmlDocument> {
  return parseXmlStreamSource(stream, options);
}

export function serializeXml(input: XmlDocument | XmlNode): string {
  return serializeXmlDocument(input);
}

export function tokenizeXml(input: string, options: XmlParseOptions = {}): XmlToken[] {
  const source = String(input ?? "");
  const tokens = tokenize(source, {
    maxErrors: options.budgets?.maxErrors ?? 1_000
  });
  return tokens.tokens;
}
