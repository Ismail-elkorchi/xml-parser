import type { BudgetCheck } from "./budgets.ts";
import type { XmlParseErrorId } from "../contracts/types.ts";
import { isValidXmlNcName, isXmlCharacter, readXmlName } from "./xml-syntax.ts";

const PREDEFINED_ENTITIES = new Map<string, string>([
  ["lt", "<"],
  ["gt", ">"],
  ["amp", "&"],
  ["apos", "'"],
  ["quot", "\""]
]);

export type ReportEntityError = (
  parseErrorId: XmlParseErrorId,
  message: string,
  offset: number
) => void;

export function decodeEntities(
  input: string,
  baseOffset: number,
  reportError: ReportEntityError,
  checkTime: BudgetCheck
): string {
  let out = "";
  let cursor = 0;

  while (cursor < input.length) {
    checkTime();
    const amp = input.indexOf("&", cursor);
    if (amp < 0) {
      out += input.slice(cursor);
      break;
    }

    out += input.slice(cursor, amp);
    const reference = readReference(input, amp, checkTime);
    if (reference === null) {
      reportError(
        "malformed-entity-reference",
        "Entity and character references must have a valid body and terminating semicolon",
        baseOffset + amp
      );
      out += "&";
      cursor = amp + 1;
      continue;
    }

    if (reference.kind === "named") {
      if (!isValidXmlNcName(reference.body)) {
        reportError(
          "malformed-qualified-name",
          `Entity reference names cannot contain a namespace separator: ${reference.body}`,
          baseOffset + amp
        );
      }
      const predefined = PREDEFINED_ENTITIES.get(reference.body);
      if (predefined === undefined) {
        reportError(
          "undefined-entity",
          `Undefined entity: &${reference.body};`,
          baseOffset + amp
        );
        out += input.slice(amp, reference.end);
      } else {
        out += predefined;
      }
      cursor = reference.end;
      continue;
    }

    checkTime();
    const codePoint = Number.parseInt(reference.digits, reference.radix);
    checkTime();
    if (!Number.isSafeInteger(codePoint) || !isXmlCharacter(codePoint)) {
      reportError(
        "invalid-character-reference",
        `Character reference does not identify a legal XML character: ${input.slice(amp, reference.end)}`,
        baseOffset + amp
      );
      out += input.slice(amp, reference.end);
    } else {
      out += String.fromCodePoint(codePoint);
    }
    cursor = reference.end;
  }

  return out;
}

type EntityReference =
  | { readonly kind: "named"; readonly body: string; readonly end: number }
  | {
      readonly kind: "numeric";
      readonly digits: string;
      readonly radix: 10 | 16;
      readonly end: number;
    };

function readReference(
  input: string,
  amp: number,
  checkTime: BudgetCheck
): EntityReference | null {
  const bodyStart = amp + 1;
  if (input.charCodeAt(bodyStart) !== 0x23) {
    const name = readXmlName(input, bodyStart, checkTime);
    if (name === null || input.charCodeAt(name.end) !== 0x3b) {
      return null;
    }
    return {
      kind: "named",
      body: name.value,
      end: name.end + 1
    };
  }

  const hexadecimal = input.charCodeAt(bodyStart + 1) === 0x78;
  const digitsStart = bodyStart + (hexadecimal ? 2 : 1);
  let cursor = digitsStart;
  while (cursor < input.length) {
    if ((cursor & 1023) === 0) {
      checkTime();
    }
    const code = input.charCodeAt(cursor);
    const valid = hexadecimal
      ? (code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x46) || (code >= 0x61 && code <= 0x66)
      : code >= 0x30 && code <= 0x39;
    if (!valid) {
      break;
    }
    cursor += 1;
  }

  if (cursor === digitsStart || input.charCodeAt(cursor) !== 0x3b) {
    return null;
  }
  return {
    kind: "numeric",
    digits: input.slice(digitsStart, cursor),
    radix: hexadecimal ? 16 : 10,
    end: cursor + 1
  };
}
