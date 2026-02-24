import type { XmlDocument, XmlNode, XmlParseOptions } from "./public/types.js";

export type { XmlDocument, XmlNode, XmlParseError, XmlParseOptions } from "./public/types.js";

function createRoot(source: string): XmlNode {
  return {
    kind: "element",
    name: "xml",
    value: source,
    children: []
  };
}

export function parseXml(input: string, options: XmlParseOptions = {}): XmlDocument {
  void options;
  const source = String(input ?? "");
  return {
    kind: "document",
    source,
    root: createRoot(source),
    errors: []
  };
}

export function parseXmlBytes(input: Uint8Array, options: XmlParseOptions = {}): XmlDocument {
  const decoder = new TextDecoder();
  return parseXml(decoder.decode(input), options);
}

export async function parseXmlStream(
  stream: ReadableStream<Uint8Array>,
  options: XmlParseOptions = {}
): Promise<XmlDocument> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }

  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return parseXmlBytes(merged, options);
}
