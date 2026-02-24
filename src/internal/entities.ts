import { createParseError } from "./parse-errors.js";
import type { XmlParseError } from "./types.js";

const PREDEFINED_ENTITIES = new Map<string, string>([
  ["lt", "<"],
  ["gt", ">"],
  ["amp", "&"],
  ["apos", "'"],
  ["quot", "\""]
]);

function parseNumericEntity(entityBody: string): string | null {
  if (entityBody.startsWith("#x")) {
    const value = Number.parseInt(entityBody.slice(2), 16);
    if (Number.isNaN(value)) {
      return null;
    }
    return String.fromCodePoint(value);
  }

  if (entityBody.startsWith("#")) {
    const value = Number.parseInt(entityBody.slice(1), 10);
    if (Number.isNaN(value)) {
      return null;
    }
    return String.fromCodePoint(value);
  }

  return null;
}

export function decodeEntities(input: string, source: string, baseOffset: number, errors: XmlParseError[]): string {
  let out = "";
  let cursor = 0;

  while (cursor < input.length) {
    const amp = input.indexOf("&", cursor);
    if (amp < 0) {
      out += input.slice(cursor);
      break;
    }

    out += input.slice(cursor, amp);
    const semi = input.indexOf(";", amp + 1);
    if (semi < 0) {
      out += "&";
      cursor = amp + 1;
      continue;
    }

    const entityBody = input.slice(amp + 1, semi);
    const predefined = PREDEFINED_ENTITIES.get(entityBody);
    if (predefined) {
      out += predefined;
      cursor = semi + 1;
      continue;
    }

    const numeric = parseNumericEntity(entityBody);
    if (numeric !== null) {
      out += numeric;
      cursor = semi + 1;
      continue;
    }

    errors.push(
      createParseError(
        "undefined-entity",
        `Undefined entity: &${entityBody};`,
        source,
        baseOffset + amp
      )
    );
    out += `&${entityBody};`;
    cursor = semi + 1;
  }

  return out;
}
