import { getParseErrorSpecRef, XmlBudgetExceededError } from "./internal/parse-errors.js";
import { parseXmlBytesSource, parseXmlSource, parseXmlStreamSource } from "./internal/parser.js";
import { serializeXmlDocument } from "./internal/serializer.js";
import { tokenizeXml as tokenize } from "./internal/tokenizer.js";
import {
  canonicalizeXml,
  computeCanonicalSha256,
  signCanonicalXml,
  verifyCanonicalSha256,
  verifyCanonicalXmlSignature
} from "./public/canonical.js";
import { createXmlReplayContract, verifyXmlReplayContract } from "./public/diagnostics.js";
import {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  listTextNodes
} from "./public/query.js";
import { validateXmlProfile } from "./public/schema.js";
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
  XmlReplayContract,
  XmlReplayEvent,
  XmlReplayInput,
  XmlReplayOptions,
  XmlReplayVerificationResult,
  XmlSpan,
  XmlTextNode,
  XmlToken
} from "./public/types.js";
export type { XmlValidationIssue, XmlValidationProfile, XmlValidationResult } from "./public/schema.js";
export type { CanonicalInput } from "./public/canonical.js";

export { XmlBudgetExceededError, getParseErrorSpecRef };
export {
  findFirstElementByQName,
  iterateElements,
  listElementsByAttribute,
  listElementsByNamespace,
  listElementsByQName,
  canonicalizeXml,
  computeCanonicalSha256,
  createXmlReplayContract,
  listTextNodes,
  signCanonicalXml,
  validateXmlProfile,
  verifyCanonicalSha256,
  verifyCanonicalXmlSignature,
  verifyXmlReplayContract
};

/**
 * Parses a UTF-16 JavaScript string into a deterministic XML document tree.
 *
 * @param input XML source text.
 * @param options Parse budgets and strictness controls.
 * @example
 * ```ts
 * const doc = parseXml("<root><item id=\"1\"/></root>");
 * console.log(doc.root?.qName);
 * ```
 */
export function parseXml(input: string, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlSource(input, options);
}

/**
 * Parses UTF-8/byte-oriented XML input into a deterministic XML document tree.
 *
 * @param input Raw XML bytes.
 * @param options Parse budgets and strictness controls.
 * @example
 * ```ts
 * const bytes = new TextEncoder().encode("<root><item/></root>");
 * const doc = parseXmlBytes(bytes);
 * console.log(doc.kind);
 * ```
 */
export function parseXmlBytes(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlBytesSource(input, options);
}

/**
 * Parses a byte stream into a deterministic XML document tree.
 *
 * @param stream Stream of UTF-8 XML bytes.
 * @param options Parse budgets and strictness controls.
 * @example
 * ```ts
 * const stream = new ReadableStream({
 *   start(controller) {
 *     controller.enqueue(new TextEncoder().encode("<root/>"));
 *     controller.close();
 *   }
 * });
 * const doc = await parseXmlStream(stream);
 * console.log(doc.root?.qName);
 * ```
 */
export async function parseXmlStream(
  stream: ReadableStream<Uint8Array>,
  options: XmlParseOptions = {}
): Promise<XmlDocument> {
  return parseXmlStreamSource(stream, options);
}

/**
 * Serializes an XML document or node back to XML text.
 *
 * @param input Full document or a node subtree.
 * @example
 * ```ts
 * const doc = parseXml("<root><item/></root>");
 * console.log(serializeXml(doc));
 * ```
 */
export function serializeXml(input: XmlDocument | XmlNode): string {
  return serializeXmlDocument(input);
}

/**
 * Tokenizes XML text using parser-compatible token rules.
 *
 * @param input XML source text.
 * @param options Parse options used to derive token budget limits.
 * @example
 * ```ts
 * const tokens = tokenizeXml("<root/>");
 * console.log(tokens.length > 0);
 * ```
 */
export function tokenizeXml(input: string, options: XmlParseOptions = {}): XmlToken[] {
  const source = String(input ?? "");
  const tokens = tokenize(source, {
    maxErrors: options.budgets?.maxErrors ?? 1_000
  });
  return tokens.tokens;
}
