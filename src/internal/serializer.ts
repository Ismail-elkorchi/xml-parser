import type { XmlDocument, XmlElementNode, XmlNode, XmlTextNode } from "./types.js";

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
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function serializeTextNode(node: XmlTextNode): string {
  return escapeText(node.value);
}

function serializeElementNode(node: XmlElementNode): string {
  const attrs = node.attributes
    .map((attr) => `${attr.qName}="${escapeAttribute(attr.value)}"`)
    .join(" ");
  const openTag = attrs.length > 0 ? `<${node.qName} ${attrs}` : `<${node.qName}`;

  if (node.children.length === 0) {
    return `${openTag}/>`;
  }

  const children = node.children.map((child) => serializeNode(child)).join("");
  return `${openTag}>${children}</${node.qName}>`;
}

function serializeNode(node: XmlNode): string {
  if (node.kind === "text") {
    return serializeTextNode(node);
  }
  return serializeElementNode(node);
}

export function serializeXmlDocument(input: XmlDocument | XmlNode): string {
  if ("kind" in input && input.kind === "document") {
    if (input.root === null) {
      return "";
    }
    return serializeNode(input.root);
  }
  return serializeNode(input);
}
