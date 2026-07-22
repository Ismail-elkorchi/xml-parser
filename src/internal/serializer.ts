import { validateSerializableInput } from "./tree-validation.ts";
import type { XmlDocument, XmlElementNode, XmlNode } from "../contracts/types.ts";

function escapeText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#xD;");
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");
}

function openTag(node: XmlElementNode): string {
  const attributes = node.attributes
    .map((attribute) => `${attribute.qName}="${escapeAttribute(attribute.value)}"`)
    .join(" ");
  return attributes.length === 0 ? `<${node.qName}>` : `<${node.qName} ${attributes}>`;
}

function serializeNode(root: XmlNode): string {
  const output: string[] = [];
  const stack: (XmlNode | string)[] = [root];
  while (stack.length > 0) {
    const item = stack.pop();
    if (item === undefined) break;
    if (typeof item === "string") {
      output.push(item);
      continue;
    }
    if (item.kind === "text") {
      output.push(escapeText(item.value));
      continue;
    }
    if (item.children.length === 0) {
      const start = openTag(item);
      output.push(`${start.slice(0, -1)}/>`);
      continue;
    }
    output.push(openTag(item));
    stack.push(`</${item.qName}>`);
    for (let index = item.children.length - 1; index >= 0; index -= 1) {
      const child = item.children[index];
      if (child !== undefined) stack.push(child);
    }
  }
  return output.join("");
}

export function serializeXmlDocument(input: XmlDocument | XmlNode): string {
  const validated = validateSerializableInput(input);
  if (validated.kind === "document") {
    return validated.root === null ? "" : serializeNode(validated.root);
  }
  return serializeNode(validated);
}
