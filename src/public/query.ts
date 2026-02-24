import type { XmlDocument, XmlElementNode, XmlNode } from "../internal/types.js";

function asRoot(input: XmlDocument | XmlElementNode): XmlElementNode | null {
  if ((input as XmlDocument).kind === "document") {
    return (input as XmlDocument).root;
  }
  return input as XmlElementNode;
}

function* walkElement(element: XmlElementNode): Generator<XmlElementNode> {
  yield element;
  for (const child of element.children) {
    if (child.kind === "element") {
      yield* walkElement(child);
    }
  }
}

export function* iterateElements(input: XmlDocument | XmlElementNode): Generator<XmlElementNode> {
  const root = asRoot(input);
  if (!root) {
    return;
  }
  yield* walkElement(root);
}

export function listElementsByQName(input: XmlDocument | XmlElementNode, qName: string): XmlElementNode[] {
  const matches: XmlElementNode[] = [];
  for (const element of iterateElements(input)) {
    if (element.qName === qName) {
      matches.push(element);
    }
  }
  return matches;
}

export function findFirstElementByQName(
  input: XmlDocument | XmlElementNode,
  qName: string
): XmlElementNode | null {
  for (const element of iterateElements(input)) {
    if (element.qName === qName) {
      return element;
    }
  }
  return null;
}

function hasAttribute(node: XmlElementNode, qName: string, value: string | undefined): boolean {
  for (const attribute of node.attributes) {
    if (attribute.qName !== qName) {
      continue;
    }
    if (value === undefined || attribute.value === value) {
      return true;
    }
  }
  return false;
}

export function listElementsByAttribute(
  input: XmlDocument | XmlElementNode,
  qName: string,
  value?: string
): XmlElementNode[] {
  const matches: XmlElementNode[] = [];
  for (const element of iterateElements(input)) {
    if (hasAttribute(element, qName, value)) {
      matches.push(element);
    }
  }
  return matches;
}

export function listElementsByNamespace(
  input: XmlDocument | XmlElementNode,
  namespaceURI: string,
  localName?: string
): XmlElementNode[] {
  const matches: XmlElementNode[] = [];
  for (const element of iterateElements(input)) {
    if (element.namespaceURI !== namespaceURI) {
      continue;
    }
    if (localName !== undefined && element.localName !== localName) {
      continue;
    }
    matches.push(element);
  }
  return matches;
}

export function listTextNodes(input: XmlDocument | XmlElementNode): XmlNode[] {
  const root = asRoot(input);
  if (!root) {
    return [];
  }

  const nodes: XmlNode[] = [];
  const stack: XmlNode[] = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (current.kind === "text") {
      nodes.push(current);
      continue;
    }
    for (let i = current.children.length - 1; i >= 0; i -= 1) {
      const child = current.children[i];
      if (child) {
        stack.push(child);
      }
    }
  }
  return nodes;
}
