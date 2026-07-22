/**
 * Namespace-aware XML parsing, serialization, querying, and structural validation.
 *
 * @example Parse a document and reject malformed input.
 * ```ts
 * import { parseXml } from "@ismail-elkorchi/xml-parser";
 *
 * const document = parseXml("<feed><entry id=\"1\"/></feed>");
 * if (document.errors.length > 0) throw new Error("Invalid XML");
 * console.log(document.root?.qName);
 * ```
 *
 * @module
 */

import {
  getParseErrorSpecRef,
  XmlBudgetExceededError,
  XmlConfigurationError,
  XmlDecodingError
} from "./contracts/errors.ts";
import {
  parseXmlBytesSource,
  parseXmlSource,
  parseXmlStreamSource,
  tokenizeXmlSource
} from "./internal/parser.ts";
import { serializeXmlDocument } from "./internal/serializer.ts";
import {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  listTextNodes
} from "./public/query.ts";
import { validateXmlProfile } from "./public/validation.ts";
import type {
  XmlDocument,
  XmlNode,
  XmlParseOptions,
  XmlTokenizeOptions,
  XmlTokenizationResult
} from "./contracts/types.ts";

export type {
  XmlAttribute,
  XmlDocument,
  XmlElementNode,
  XmlNode,
  XmlNodeKind,
  XmlParseBudgets,
  XmlParseError,
  XmlParseErrorId,
  XmlParseOptions,
  XmlSpan,
  XmlTextNode,
  XmlToken,
  XmlTokenAttribute,
  XmlTokenizeBudgets,
  XmlTokenizeOptions,
  XmlTokenizationResult
} from "./contracts/types.ts";
export type {
  XmlValidationIssue,
  XmlValidationProfile,
  XmlValidationResult
} from "./public/validation.ts";
export type { XmlConfigurationErrorCode } from "./contracts/errors.ts";

export { XmlBudgetExceededError, XmlConfigurationError, XmlDecodingError, getParseErrorSpecRef };
export {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  listTextNodes,
  validateXmlProfile
};

/**
 * Parses XML text into a namespace-aware tree and diagnostic list.
 *
 * The returned tree may contain recovery output when `errors` is non-empty.
 * Applications handling untrusted input should reject such documents.
 *
 * @param input XML source text.
 * @param options Resource limits for parsing.
 * @example
 * ```ts
 * const document = parseXml("<root><item/></root>");
 * console.log(document.errors.length, document.root?.qName);
 * ```
 */
export function parseXml(input: string, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlSource(input, options);
}

/**
 * Decodes UTF-8 bytes and parses the resulting XML document.
 *
 * @param input UTF-8 XML bytes.
 * @param options Resource limits for decoding and parsing.
 * @example
 * ```ts
 * const bytes = new TextEncoder().encode("<root/>");
 * console.log(parseXmlBytes(bytes).root?.qName);
 * ```
 */
export function parseXmlBytes(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlBytesSource(input, options);
}

/**
 * Reads a stream of UTF-8 bytes and parses it as XML.
 *
 * The reader is cancelled on failure and its lock is always released. Parsing
 * starts after the complete byte stream has been decoded.
 *
 * @param stream Stream of UTF-8 XML bytes.
 * @param options Resource limits for reading, decoding, and parsing.
 * @example
 * ```ts
 * const bytes = new TextEncoder().encode("<root/>");
 * const stream = new ReadableStream({
 *   start(controller) { controller.enqueue(bytes); controller.close(); }
 * });
 * console.log((await parseXmlStream(stream)).root?.qName);
 * ```
 */
export function parseXmlStream(
  stream: ReadableStream<Uint8Array>,
  options: XmlParseOptions = {}
): Promise<XmlDocument> {
  return parseXmlStreamSource(stream, options);
}

/**
 * Serializes a document or node as well-formed XML.
 *
 * @param input Parsed document or caller-constructed node tree.
 * @example
 * ```ts
 * console.log(serializeXml(parseXml("<root><item/></root>")));
 * ```
 */
export function serializeXml(input: XmlDocument | XmlNode): string {
  return serializeXmlDocument(input);
}

/**
 * Tokenizes XML text and returns both lexical tokens and diagnostics.
 *
 * @param input XML source text.
 * @param options Resource limits for tokenization.
 * @example
 * ```ts
 * const result = tokenizeXml("<root/>");
 * console.log(result.tokens[0]?.kind, result.errors.length);
 * ```
 */
export function tokenizeXml(input: string, options: XmlTokenizeOptions = {}): XmlTokenizationResult {
  return tokenizeXmlSource(input, options);
}
