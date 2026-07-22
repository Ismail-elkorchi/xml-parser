import { XmlConfigurationError, type XmlConfigurationErrorCode } from "../contracts/errors.ts";

export function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string") {
    invalid("INVALID_ARGUMENT", path, "must be a string");
  }
}

export function assertUint8Array(value: unknown, path: string): asserts value is Uint8Array {
  if (!(value instanceof Uint8Array)) {
    invalid("INVALID_ARGUMENT", path, "must be a Uint8Array");
  }
}

export function assertReadableByteStream(
  value: unknown,
  path: string
): asserts value is ReadableStream<Uint8Array> {
  if (!isRecord(value) || typeof value["getReader"] !== "function") {
    invalid("INVALID_ARGUMENT", path, "must be a readable byte stream");
  }
}

export function assertRecord(value: unknown, code: XmlConfigurationErrorCode, path: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    invalid(code, path, "must be an object");
  }
}

export function invalid(code: XmlConfigurationErrorCode, path: string, message: string): never {
  throw new XmlConfigurationError(code, path, message);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
