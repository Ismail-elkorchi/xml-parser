import {
  canonicalizeXml as canonicalizeXmlInternal,
  computeCanonicalSha256 as computeCanonicalSha256Internal,
  parseXml as parseXmlInternal,
  parseXmlBytes as parseXmlBytesInternal,
  parseXmlStream as parseXmlStreamInternal,
  serializeXml as serializeXmlInternal,
  tokenizeXml as tokenizeXmlInternal,
  validateXmlProfile as validateXmlProfileInternal
} from "../src/mod.ts";

/**
 * Parse an XML document string into a deterministic document object.
 */
export function parseXml(input: string, options?: Record<string, unknown>): unknown {
  return parseXmlInternal(input, options as Parameters<typeof parseXmlInternal>[1]);
}

/**
 * Parse encoded XML bytes.
 */
export function parseXmlBytes(input: Uint8Array, options?: Record<string, unknown>): unknown {
  return parseXmlBytesInternal(input, options as Parameters<typeof parseXmlBytesInternal>[1]);
}

/**
 * Parse XML bytes from a stream.
 */
export async function parseXmlStream(
  stream: ReadableStream<Uint8Array>,
  options?: Record<string, unknown>
): Promise<unknown> {
  return parseXmlStreamInternal(stream, options as Parameters<typeof parseXmlStreamInternal>[1]);
}

/**
 * Serialize a parsed XML document or node.
 */
export function serializeXml(input: unknown): string {
  return serializeXmlInternal(input as Parameters<typeof serializeXmlInternal>[0]);
}

/**
 * Tokenize XML source text.
 */
export function tokenizeXml(input: string, options?: Record<string, unknown>): readonly unknown[] {
  return tokenizeXmlInternal(input, options as Parameters<typeof tokenizeXmlInternal>[1]);
}

/**
 * Validate a parsed document against a profile contract.
 */
export function validateXmlProfile(document: unknown, profile: unknown): unknown {
  return validateXmlProfileInternal(
    document as Parameters<typeof validateXmlProfileInternal>[0],
    profile as Parameters<typeof validateXmlProfileInternal>[1]
  );
}

/**
 * Canonicalize XML input for stable hashing and signatures.
 */
export function canonicalizeXml(input: unknown): string {
  return canonicalizeXmlInternal(input as Parameters<typeof canonicalizeXmlInternal>[0]);
}

/**
 * Compute SHA-256 over canonicalized XML.
 */
export function computeCanonicalSha256(input: unknown): string {
  return computeCanonicalSha256Internal(input as Parameters<typeof computeCanonicalSha256Internal>[0]);
}
