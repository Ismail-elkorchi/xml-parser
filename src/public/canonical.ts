import type { XmlDocument, XmlElementNode, XmlNode } from "../internal/types.js";

export type CanonicalInput = XmlDocument | XmlElementNode;

function resolveRoot(input: CanonicalInput): XmlElementNode | null {
  if ((input as XmlDocument).kind === "document") {
    return (input as XmlDocument).root;
  }
  return input as XmlElementNode;
}

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");
}

function renderNode(node: XmlNode): string {
  if (node.kind === "text") {
    return escapeText(node.value);
  }

  const sortedAttributes = [...node.attributes].sort((a, b) => {
    const namespaceA = a.namespaceURI ?? "";
    const namespaceB = b.namespaceURI ?? "";
    if (namespaceA !== namespaceB) {
      return namespaceA.localeCompare(namespaceB);
    }
    return a.qName.localeCompare(b.qName);
  });

  const attrs = sortedAttributes
    .map((attribute) => `${attribute.qName}="${escapeAttribute(attribute.value)}"`)
    .join(" ");

  const open = attrs.length > 0 ? `<${node.qName} ${attrs}>` : `<${node.qName}>`;
  const content = node.children.map((child) => renderNode(child)).join("");
  const close = `</${node.qName}>`;
  return `${open}${content}${close}`;
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toArrayBuffer(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function getSubtle(): SubtleCrypto {
  const maybeCrypto = globalThis.crypto;
  if (!maybeCrypto || !maybeCrypto.subtle) {
    throw new Error("WebCrypto SubtleCrypto is required");
  }
  return maybeCrypto.subtle;
}/**
 * Provides deterministic public behavior for `canonicalizeXml`.
 */


export function canonicalizeXml(input: CanonicalInput): string {
  const root = resolveRoot(input);
  if (!root) {
    return "";
  }
  return renderNode(root);
}/**
 * Computes deterministic public output for `computeCanonicalSha256`.
 */


export async function computeCanonicalSha256(input: CanonicalInput): Promise<string> {
  const canonical = canonicalizeXml(input);
  const digest = await getSubtle().digest("SHA-256", toArrayBuffer(canonical));
  return toHex(new Uint8Array(digest));
}/**
 * Verifies public invariants for `verifyCanonicalSha256` deterministically.
 */


export async function verifyCanonicalSha256(input: CanonicalInput, expectedHex: string): Promise<boolean> {
  const observed = await computeCanonicalSha256(input);
  return observed.toLowerCase() === expectedHex.toLowerCase();
}/**
 * Provides deterministic public behavior for `signCanonicalXml`.
 */


export async function signCanonicalXml(
  input: CanonicalInput,
  privateKey: CryptoKey,
  algorithm: AlgorithmIdentifier = "RSASSA-PKCS1-v1_5"
): Promise<Uint8Array> {
  const canonical = canonicalizeXml(input);
  const signature = await getSubtle().sign(algorithm, privateKey, toArrayBuffer(canonical));
  return new Uint8Array(signature);
}/**
 * Verifies public invariants for `verifyCanonicalXmlSignature` deterministically.
 */


export async function verifyCanonicalXmlSignature(
  input: CanonicalInput,
  signature: Uint8Array,
  publicKey: CryptoKey,
  algorithm: AlgorithmIdentifier = "RSASSA-PKCS1-v1_5"
): Promise<boolean> {
  const canonical = canonicalizeXml(input);
  return getSubtle().verify(algorithm, publicKey, asArrayBuffer(signature), toArrayBuffer(canonical));
}
