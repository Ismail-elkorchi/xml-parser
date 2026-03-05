/**
 * Deno/JSR entrypoint for deterministic XML parsing, validation, and canonicalization.
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
  parseXml as parseXmlInternal,
  parseXmlBytes as parseXmlBytesInternal,
  parseXmlStream as parseXmlStreamInternal,
  serializeXml as serializeXmlInternal,
  signCanonicalXml as signCanonicalXmlInternal,
  tokenizeXml as tokenizeXmlInternal,
  validateXmlProfile as validateXmlProfileInternal,
  verifyCanonicalSha256 as verifyCanonicalSha256Internal,
  verifyCanonicalXmlSignature as verifyCanonicalXmlSignatureInternal
} from "../src/mod.ts";

/**
 * Parse budget controls for XML parsing.
 */
export interface XmlParseBudgets {
  /** Maximum bytes accepted by string/byte parse entrypoints. */
  readonly maxInputBytes?: number;
  /** Maximum bytes consumed from stream parse entrypoints. */
  readonly maxStreamBytes?: number;
  /** Maximum XML node count. */
  readonly maxNodes?: number;
  /** Maximum XML nesting depth. */
  readonly maxDepth?: number;
  /** Maximum attributes allowed per element node. */
  readonly maxAttributesPerElement?: number;
  /** Maximum text payload bytes accumulated by parser text nodes. */
  readonly maxTextBytes?: number;
  /** Maximum non-fatal parse errors collected before budget failure. */
  readonly maxErrors?: number;
  /** Maximum parse runtime in milliseconds. */
  readonly maxTimeMs?: number;
}

/**
 * Parse options accepted by XML parse entrypoints.
 */
export interface XmlParseOptions {
  /** When `true` (default), enforce strict XML parsing behavior. */
  readonly strict?: boolean;
  /** Optional budget controls for parse safety. */
  readonly budgets?: XmlParseBudgets;
}

/**
 * Validation profile for `validateXmlProfile`.
 */
export interface XmlValidationProfile {
  /** Expected QName for the root element. */
  readonly expectedRootQName?: string;
  /** Element QNames that must appear at least once. */
  readonly requiredElementQNames?: readonly string[];
  /** Required attribute names keyed by element QName. */
  readonly requiredAttributesByElementQName?: Readonly<Record<string, readonly string[]>>;
  /** Maximum element occurrences keyed by element QName. */
  readonly maxOccurrencesByElementQName?: Readonly<Record<string, number>>;
}

/**
 * Validation issue reported by `validateXmlProfile`.
 */
export interface XmlValidationIssue {
  /** Stable machine-readable validation issue code. */
  readonly code: string;
  /** Human-readable issue summary. */
  readonly message: string;
  /** Optional QName related to this issue. */
  readonly qName?: string;
  /** Optional element QName related to this issue. */
  readonly elementQName?: string;
  /** Optional attribute QName related to this issue. */
  readonly attributeQName?: string;
  /** Optional node id associated with this issue. */
  readonly nodeId?: number;
}

/**
 * Structured validation result returned by `validateXmlProfile`.
 */
export interface XmlValidationResult {
  /** Whether profile validation succeeded without issues. */
  readonly ok: boolean;
  /** Validation issues emitted by the profile check. */
  readonly issues: readonly XmlValidationIssue[];
}

/**
 * Parsed XML document returned by XML parse entrypoints.
 */
export interface XmlDocument {
  /** Top-level document discriminator. */
  readonly kind: string;
  /** Optional root element node, when parse succeeds far enough to produce one. */
  readonly root?: XmlNode | null;
  /** Optional non-fatal parse diagnostics. */
  readonly errors?: readonly XmlParseError[];
}

/**
 * XML node type accepted by `serializeXml`.
 */
export interface XmlNode {
  /** Node category (element, text, comment, etc.). */
  readonly kind: string;
  /** Qualified name for element-like nodes. */
  readonly qName?: string;
  /** Text payload for text/comment-like nodes. */
  readonly value?: string;
  /** Child nodes in source order. */
  readonly children?: readonly XmlNode[];
}

/**
 * XML token emitted by `tokenizeXml`.
 */
export interface XmlToken {
  /** Token category from XML tokenization. */
  readonly kind: string;
  /** Optional qualified name for tag-like tokens. */
  readonly qName?: string;
  /** Optional token payload for text-like tokens. */
  readonly value?: string;
}

/**
 * Canonicalization input accepted by canonicalization/signature APIs.
 */
export type CanonicalInput = XmlDocument | XmlNode | string;

/**
 * Structured parse issue surfaced by XML parse APIs.
 */
export interface XmlParseError {
  /** Stable parser error code. */
  readonly code: string;
  /** Human-readable error description. */
  readonly message: string;
}

/**
 * Parses XML source text into a deterministic document tree.
 *
 * @param input XML source text.
 * @param options Parse strictness and budget controls.
 * @returns Parsed XML document with root, tokens, and diagnostics.
 * @throws {Error} When parsing fails fatally or configured budgets are exceeded.
 *
 * Security and limits:
 * - Keep `strict` enabled for untrusted input.
 * - Set explicit budgets to bound parser work.
 *
 * @example
 * ```ts
 * import { parseXml } from "./mod.ts";
 *
 * const doc = parseXml("<root><item id=\"1\"/></root>", {
 *   strict: true,
 *   budgets: { maxInputBytes: 8_192, maxNodes: 1_024, maxDepth: 64, maxErrors: 16 }
 * });
 *
 * console.log(doc.kind);
 * console.log(doc.root?.qName);
 * ```
 */
export function parseXml(input: string, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlInternal(input, options as Parameters<typeof parseXmlInternal>[1]);
}

/**
 * Parses byte-oriented XML input.
 *
 * @param input Raw XML bytes.
 * @param options Parse strictness and budget controls.
 * @returns Parsed XML document.
 * @throws {Error} When parsing fails or configured budgets are exceeded.
 */
export function parseXmlBytes(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  return parseXmlBytesInternal(input, options as Parameters<typeof parseXmlBytesInternal>[1]);
}

/**
 * Parses XML bytes from a readable stream.
 *
 * @param stream XML byte stream.
 * @param options Parse strictness and budget controls.
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
  return parseXmlStreamInternal(stream, options as Parameters<typeof parseXmlStreamInternal>[1]);
}

/**
 * Serializes an XML document or node subtree back to text.
 *
 * @param input Parsed XML document or node.
 * @returns Deterministic XML serialization output.
 */
export function serializeXml(input: XmlDocument | XmlNode): string {
  return serializeXmlInternal(input as Parameters<typeof serializeXmlInternal>[0]);
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
  return tokenizeXmlInternal(input, options as Parameters<typeof tokenizeXmlInternal>[1]);
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
  document: XmlDocument | XmlNode,
  profile: XmlValidationProfile
): XmlValidationResult {
  return validateXmlProfileInternal(
    document as Parameters<typeof validateXmlProfileInternal>[0],
    profile as Parameters<typeof validateXmlProfileInternal>[1]
  ) as XmlValidationResult;
}

/**
 * Canonicalizes XML for deterministic hashing and signatures.
 *
 * @param input XML document or root element.
 * @returns Canonical XML string.
 */
export function canonicalizeXml(input: CanonicalInput): string {
  return canonicalizeXmlInternal(input as Parameters<typeof canonicalizeXmlInternal>[0]);
}

/**
 * Computes SHA-256 over canonicalized XML.
 *
 * @param input XML document or root element.
 * @returns Lowercase hexadecimal SHA-256 digest.
 * @throws {Error} When WebCrypto `SubtleCrypto` is unavailable.
 */
export async function computeCanonicalSha256(input: CanonicalInput): Promise<string> {
  return computeCanonicalSha256Internal(input as Parameters<typeof computeCanonicalSha256Internal>[0]);
}

/**
 * Verifies SHA-256 digest against canonicalized XML.
 *
 * @param input XML document or root element.
 * @param expectedHex Expected digest in hexadecimal form.
 * @returns `true` when digest matches, otherwise `false`.
 */
export async function verifyCanonicalSha256(input: CanonicalInput, expectedHex: string): Promise<boolean> {
  return verifyCanonicalSha256Internal(
    input as Parameters<typeof verifyCanonicalSha256Internal>[0],
    expectedHex
  );
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
  return signCanonicalXmlInternal(
    input as Parameters<typeof signCanonicalXmlInternal>[0],
    privateKey,
    algorithm
  );
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
  return verifyCanonicalXmlSignatureInternal(
    input as Parameters<typeof verifyCanonicalXmlSignatureInternal>[0],
    signature,
    publicKey,
    algorithm
  );
}
