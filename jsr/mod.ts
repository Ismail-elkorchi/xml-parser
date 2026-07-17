/**
 * Deno/JSR entrypoint for XML parsing with namespaces, canonicalization, validation helpers, and safe DTD defaults.
 *
 * Quickstart:
 * @example
 * ```ts
 * import { parseXml, serializeXml } from "./mod.ts";
 * // Published package form:
 * // import { parseXml, serializeXml } from "jsr:@ismail-elkorchi/xml-parser";
 *
 * const doc = parseXml("<invoice><line amount=\"10\"/></invoice>");
 * console.log(doc.root?.qName);
 * console.log(serializeXml(doc));
 * ```
 *
 * Additional docs:
 * - `./docs/index.md`
 * - `./docs/reference/options.md`
 */
import {
  canonicalizeXml as canonicalizeXmlInternal,
  computeCanonicalSha256 as computeCanonicalSha256Internal,
  getParseErrorSpecRef,
  parseXml as parseXmlInternal,
  parseXmlBytes as parseXmlBytesInternal,
  parseXmlStream as parseXmlStreamInternal,
  serializeXml as serializeXmlInternal,
  signCanonicalXml as signCanonicalXmlInternal,
  tokenizeXml as tokenizeXmlInternal,
  validateXmlProfile as validateXmlProfileInternal,
  verifyCanonicalSha256 as verifyCanonicalSha256Internal,
  verifyCanonicalXmlSignature as verifyCanonicalXmlSignatureInternal,
  XmlBudgetExceededError,
  XmlDecodingError
} from "../src/mod.ts";
import type {
  CanonicalInput,
  XmlDocument,
  XmlElementNode,
  XmlNode,
  XmlParseOptions,
  XmlToken,
  XmlValidationProfile,
  XmlValidationResult
} from "../src/mod.ts";

export type {
  CanonicalInput,
  XmlAttribute,
  XmlDocument,
  XmlElementNode,
  XmlNode,
  XmlParseBudgets,
  XmlParseError,
  XmlParseOptions,
  XmlSpan,
  XmlTextNode,
  XmlToken,
  XmlTokenAttribute,
  XmlValidationIssue,
  XmlValidationProfile,
  XmlValidationResult
} from "../src/mod.ts";

export { XmlBudgetExceededError, XmlDecodingError, getParseErrorSpecRef };

/**
 * Parses XML source text into a deterministic document tree.
 *
 * @param input XML source text.
 * @param options Parse budget controls.
 * @returns Parsed XML document with root, tokens, and diagnostics.
 * @throws {Error} When parsing fails fatally or configured budgets are exceeded.
 *
 * Security and limits: set explicit budgets to bound parser work.
 *
 * @example
 * ```ts
 * import { parseXml } from "./mod.ts";
 *
 * const doc = parseXml("<root><item id=\"1\"/></root>", {
 *   budgets: { maxInputBytes: 8_192, maxNodes: 1_024, maxDepth: 64, maxErrors: 16 }
 * });
 *
 * console.log(doc.kind);
 * console.log(doc.root?.qName);
 * ```
 */
export function parseXml(input: string, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlInternal(input, options);
}

/**
 * Parses byte-oriented XML input.
 *
 * @param input Raw XML bytes.
 * @param options Parse budget controls.
 * @returns Parsed XML document.
 * @throws {Error} When parsing fails or configured budgets are exceeded.
 */
export function parseXmlBytes(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlBytesInternal(input, options);
}

/**
 * Parses XML bytes from a readable stream.
 *
 * @param stream XML byte stream.
 * @param options Parse budget controls.
 * @returns Promise resolving to parsed XML document.
 * @throws {Error} When stream reading/parsing fails or budgets are exceeded.
 *
 * @example
 * ```ts
 * import { parseXmlStream } from "./mod.ts";
 *
 * const stream = new ReadableStream({
 *   start(controller) {
 *     controller.enqueue(new TextEncoder().encode("<feed><entry id=\"1\"/>"));
 *     controller.enqueue(new TextEncoder().encode("<entry id=\"2\"/></feed>"));
 *     controller.close();
 *   }
 * });
 *
 * const doc = await parseXmlStream(stream, {
 *   budgets: { maxStreamBytes: 16_384, maxNodes: 2_048, maxDepth: 64 }
 * });
 *
 * console.log(doc.kind);
 * ```
 */
export async function parseXmlStream(
  stream: ReadableStream<Uint8Array>,
  options: XmlParseOptions = {}
): Promise<XmlDocument> {
  return parseXmlStreamInternal(stream, options);
}

/**
 * Serializes an XML document or node subtree back to text.
 *
 * @param input Parsed XML document or node.
 * @returns Deterministic XML serialization output.
 */
export function serializeXml(input: XmlDocument | XmlNode): string {
  return serializeXmlInternal(input);
}

/**
 * Tokenizes XML source text.
 *
 * @param input XML source text.
 * @param options Parse options used to derive tokenization budgets.
 * @returns XML token sequence.
 * @throws {Error} When tokenization fails or budgets are exceeded.
 */
export function tokenizeXml(input: string, options: XmlParseOptions = {}): readonly XmlToken[] {
  return tokenizeXmlInternal(input, options);
}

/**
 * Validates a parsed XML document/node against a structural profile.
 *
 * @param document Parsed XML document or root element node.
 * @param profile Validation profile constraints.
 * @returns Validation result with pass/fail status and issue list.
 *
 * @example
 * ```ts
 * import { parseXml, validateXmlProfile } from "./mod.ts";
 *
 * const doc = parseXml("<invoice><line/></invoice>");
 * const result = validateXmlProfile(doc, {
 *   expectedRootQName: "invoice",
 *   requiredElementQNames: ["line"]
 * });
 *
 * console.log(result.ok);
 * ```
 */
export function validateXmlProfile(
  document: XmlDocument | XmlElementNode,
  profile: XmlValidationProfile
): XmlValidationResult {
  return validateXmlProfileInternal(document, profile);
}

/**
 * Canonicalizes XML for deterministic hashing and signatures.
 *
 * @param input XML document or root element.
 * @returns Canonical XML string.
 *
 * Constraint notes:
 * - Attribute order is normalized deterministically.
 * - Digest/signature helpers rely on this canonical output.
 *
 * @example
 * ```ts
 * import { canonicalizeXml, parseXml } from "./mod.ts";
 *
 * const doc = parseXml("<root b=\"2\" a=\"1\"/>");
 * console.log(canonicalizeXml(doc));
 * ```
 */
export function canonicalizeXml(input: CanonicalInput): string {
  return canonicalizeXmlInternal(input);
}

/**
 * Computes SHA-256 over canonicalized XML.
 *
 * @param input XML document or root element.
 * @returns Lowercase hexadecimal SHA-256 digest.
 * @throws {Error} When WebCrypto `SubtleCrypto` is unavailable.
 */
export async function computeCanonicalSha256(input: CanonicalInput): Promise<string> {
  return computeCanonicalSha256Internal(input);
}

/**
 * Verifies SHA-256 digest against canonicalized XML.
 *
 * @param input XML document or root element.
 * @param expectedHex Expected digest in hexadecimal form.
 * @returns `true` when digest matches, otherwise `false`.
 */
export async function verifyCanonicalSha256(input: CanonicalInput, expectedHex: string): Promise<boolean> {
  return verifyCanonicalSha256Internal(input, expectedHex);
}

/**
 * Signs canonicalized XML bytes with a private key.
 *
 * @param input XML document or root element.
 * @param privateKey Private key used by WebCrypto signing APIs.
 * @param algorithm Signature algorithm identifier.
 * @returns Signature bytes.
 * @throws {Error} When WebCrypto signing APIs are unavailable.
 */
export async function signCanonicalXml(
  input: CanonicalInput,
  privateKey: CryptoKey,
  algorithm: AlgorithmIdentifier = "RSASSA-PKCS1-v1_5"
): Promise<Uint8Array> {
  return signCanonicalXmlInternal(input, privateKey, algorithm);
}

/**
 * Verifies signature bytes against canonicalized XML.
 *
 * @param input XML document or root element.
 * @param signature Signature bytes to verify.
 * @param publicKey Public key used by WebCrypto verification APIs.
 * @param algorithm Signature algorithm identifier.
 * @returns `true` when signature verification succeeds.
 * @throws {Error} When WebCrypto verification APIs are unavailable.
 */
export async function verifyCanonicalXmlSignature(
  input: CanonicalInput,
  signature: Uint8Array,
  publicKey: CryptoKey,
  algorithm: AlgorithmIdentifier = "RSASSA-PKCS1-v1_5"
): Promise<boolean> {
  return verifyCanonicalXmlSignatureInternal(input, signature, publicKey, algorithm);
}
