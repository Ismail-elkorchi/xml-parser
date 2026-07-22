import { assertRecord, assertString, invalid } from "./arguments.ts";
import type { XmlDocument, XmlNode } from "../contracts/types.ts";
import { isValidXmlQName, isXmlCharacter, splitXmlQName } from "./xml-syntax.ts";

const XML_NS = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NS = "http://www.w3.org/2000/xmlns/";

interface PendingNode {
  readonly node: unknown;
  readonly namespaces: ReadonlyMap<string, string>;
  readonly path: string;
}

export function validateSerializableInput(input: unknown): XmlDocument | XmlNode {
  assertRecord(input, "INVALID_TREE", "input");
  const root = input["kind"] === "document" ? validateDocument(input) : input;
  if (root === null) return input as unknown as XmlDocument;

  const seen = new WeakSet<object>();
  const stack: PendingNode[] = [{
    node: root,
    namespaces: new Map([["xml", XML_NS], ["xmlns", XMLNS_NS]]),
    path: input["kind"] === "document" ? "input.root" : "input"
  }];

  while (stack.length > 0) {
    const pending = stack.pop();
    if (pending === undefined) break;
    assertRecord(pending.node, "INVALID_TREE", pending.path);
    if (seen.has(pending.node)) invalid("INVALID_TREE", pending.path, "must belong to an acyclic tree");
    seen.add(pending.node);

    if (pending.node["kind"] === "text") {
      assertString(pending.node["value"], `${pending.path}.value`);
      assertXmlCharacters(pending.node["value"], `${pending.path}.value`);
      continue;
    }
    if (pending.node["kind"] !== "element") {
      invalid("INVALID_TREE", `${pending.path}.kind`, 'must be "element" or "text"');
    }

    assertString(pending.node["qName"], `${pending.path}.qName`);
    if (!isValidXmlQName(pending.node["qName"])) {
      invalid("INVALID_TREE", `${pending.path}.qName`, "must be a valid XML qualified name");
    }
    if (!Array.isArray(pending.node["attributes"])) {
      invalid("INVALID_TREE", `${pending.path}.attributes`, "must be an array");
    }
    if (!Array.isArray(pending.node["children"])) {
      invalid("INVALID_TREE", `${pending.path}.children`, "must be an array");
    }

    const namespaces = validateAttributes(
      pending.node["attributes"],
      pending.namespaces,
      `${pending.path}.attributes`
    );
    const elementName = splitXmlQName(pending.node["qName"]);
    if (elementName.prefix === "xmlns") {
      invalid("INVALID_TREE", `${pending.path}.qName`, "cannot use the reserved xmlns prefix");
    }
    if (elementName.prefix !== null && namespaces.get(elementName.prefix) === undefined) {
      invalid("INVALID_TREE", `${pending.path}.qName`, `uses undeclared prefix ${elementName.prefix}`);
    }
    validateNameMetadata(
      pending.node,
      elementName.localName,
      elementName.prefix,
      elementName.prefix === null ? namespaces.get("") ?? null : namespaces.get(elementName.prefix) ?? null,
      pending.path
    );

    const children = pending.node["children"];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push({ node: children[index], namespaces, path: `${pending.path}.children[${String(index)}]` });
    }
  }

  return input as unknown as XmlDocument | XmlNode;
}

function validateDocument(document: Record<string, unknown>): unknown {
  if (!Array.isArray(document["errors"])) {
    invalid("INVALID_TREE", "input.errors", "must be an array");
  }
  if (document["errors"].length > 0) {
    invalid("INVALID_TREE", "input.errors", "must be empty before serialization");
  }
  const root = document["root"];
  if (root !== null && typeof root !== "object") {
    invalid("INVALID_TREE", "input.root", "must be an element or null");
  }
  if (root !== null) {
    assertRecord(root, "INVALID_TREE", "input.root");
    if (root["kind"] !== "element") invalid("INVALID_TREE", "input.root.kind", 'must be "element"');
  }
  return root;
}

function validateAttributes(
  attributes: readonly unknown[],
  parentNamespaces: ReadonlyMap<string, string>,
  path: string
): ReadonlyMap<string, string> {
  const namespaces = new Map(parentNamespaces);
  const qNames = new Set<string>();
  const normalized: { readonly qName: string; readonly value: string }[] = [];

  for (let index = 0; index < attributes.length; index += 1) {
    const attributePath = `${path}[${String(index)}]`;
    const attribute = attributes[index];
    assertRecord(attribute, "INVALID_TREE", attributePath);
    assertString(attribute["qName"], `${attributePath}.qName`);
    assertString(attribute["value"], `${attributePath}.value`);
    if (!isValidXmlQName(attribute["qName"])) {
      invalid("INVALID_TREE", `${attributePath}.qName`, "must be a valid XML qualified name");
    }
    if (qNames.has(attribute["qName"])) {
      invalid("INVALID_TREE", `${attributePath}.qName`, "duplicates an earlier attribute name");
    }
    qNames.add(attribute["qName"]);
    normalized.push({ qName: attribute["qName"], value: attribute["value"] });
    assertXmlCharacters(attribute["value"], `${attributePath}.value`);
    if (attribute["qName"] === "xmlns") {
      validateNameMetadata(attribute, "xmlns", null, XMLNS_NS, attributePath);
      validateNamespaceName(attribute["value"], "", `${attributePath}.value`);
      if (attribute["value"].length === 0) namespaces.delete("");
      else namespaces.set("", attribute["value"]);
    } else if (attribute["qName"].startsWith("xmlns:")) {
      const prefix = attribute["qName"].slice(6);
      validateNameMetadata(attribute, prefix, "xmlns", XMLNS_NS, attributePath);
      validateNamespaceName(attribute["value"], prefix, `${attributePath}.value`);
      namespaces.set(prefix, attribute["value"]);
    }
  }

  const expandedNames = new Set<string>();
  for (let index = 0; index < normalized.length; index += 1) {
    const qName = normalized[index]?.qName;
    if (qName === undefined) continue;
    if (qName === "xmlns" || qName.startsWith("xmlns:")) continue;
    const split = splitXmlQName(qName);
    const namespace = split.prefix === null ? null : namespaces.get(split.prefix);
    if (split.prefix !== null && namespace === undefined) {
      invalid("INVALID_TREE", `${path}[${String(index)}].qName`, `uses undeclared prefix ${split.prefix}`);
    }
    const attribute = attributes[index];
    assertRecord(attribute, "INVALID_TREE", `${path}[${String(index)}]`);
    validateNameMetadata(attribute, split.localName, split.prefix, namespace ?? null, `${path}[${String(index)}]`);
    const expanded = `${namespace ?? ""}\u0000${split.localName}`;
    if (expandedNames.has(expanded)) {
      invalid("INVALID_TREE", `${path}[${String(index)}].qName`, "duplicates an expanded attribute name");
    }
    expandedNames.add(expanded);
  }
  return namespaces;
}

function validateNamespaceName(value: string, prefix: string, path: string): void {
  if (prefix === "xmlns") invalid("INVALID_TREE", path, "cannot declare the reserved xmlns prefix");
  if (value === XMLNS_NS) invalid("INVALID_TREE", path, "cannot use the reserved xmlns namespace name");
  if (prefix === "xml" && value !== XML_NS) invalid("INVALID_TREE", path, "must bind xml to its reserved namespace");
  if (prefix !== "xml" && value === XML_NS) invalid("INVALID_TREE", path, "cannot bind another prefix to the xml namespace");
  if (prefix !== "" && value.length === 0) invalid("INVALID_TREE", path, "cannot undeclare a namespace prefix");
}

function validateNameMetadata(
  node: Record<string, unknown>,
  expectedLocalName: string,
  expectedPrefix: string | null,
  expectedNamespaceURI: string | null,
  path: string
): void {
  assertString(node["localName"], `${path}.localName`);
  assertNullableString(node["prefix"], `${path}.prefix`);
  assertNullableString(node["namespaceURI"], `${path}.namespaceURI`);
  if (node["localName"] !== expectedLocalName) {
    invalid("INVALID_TREE", `${path}.localName`, `must match qualified name component ${expectedLocalName}`);
  }
  if (node["prefix"] !== expectedPrefix) {
    invalid("INVALID_TREE", `${path}.prefix`, `must match qualified name prefix ${expectedPrefix ?? "null"}`);
  }
  if (node["namespaceURI"] !== expectedNamespaceURI) {
    invalid("INVALID_TREE", `${path}.namespaceURI`, "must match the in-scope namespace binding");
  }
}

function assertNullableString(value: unknown, path: string): asserts value is string | null {
  if (value !== null) assertString(value, path);
}

function assertXmlCharacters(value: string, path: string): void {
  for (let offset = 0; offset < value.length;) {
    const codePoint = value.codePointAt(offset);
    if (codePoint === undefined || !isXmlCharacter(codePoint)) {
      invalid("INVALID_TREE", path, "contains a character forbidden by XML 1.0");
    }
    offset += codePoint > 0xffff ? 2 : 1;
  }
}
