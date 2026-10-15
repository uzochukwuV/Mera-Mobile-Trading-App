import { type MeraErrorCode } from "./errors.js";
/**
 * Copies bytes into a standalone `Uint8Array`.
 *
 * @internal
 */
declare function copyBytes(value: Uint8Array): Uint8Array<ArrayBuffer>;
declare function normalizeByteArray(value: ArrayBuffer | ArrayBufferView | ArrayLike<number>, options: {
    name: string;
    code: MeraErrorCode;
}): Uint8Array;
/**
 * Encodes bytes as canonical unpadded base64url.
 *
 * @internal
 */
declare function base64UrlEncode(value: Uint8Array): string;
/**
 * Decodes canonical unpadded base64url into bytes.
 *
 * @param value - Canonical unpadded base64url text.
 * @param options - Optional constraints on the decoded bytes and error reporting.
 * @param options.name - Value name used in error messages. Defaults to `"value"`.
 * @param options.code - Error code thrown on failure. Defaults to `"INPUT_INVALID"`.
 * @param options.byteLength - Exact decoded length in bytes.
 * @param options.minByteLength - Minimum decoded length in bytes.
 * @returns Decoded bytes.
 * @throws MeraError with `options.code` when `value` uses invalid characters, invalid length, or non-canonical padding, or the decoded bytes violate `options.byteLength` or `options.minByteLength`.
 * @internal
 */
declare function base64UrlDecode(value: string, options?: {
    name?: string;
    code?: MeraErrorCode;
    byteLength?: number;
    minByteLength?: number;
}): Uint8Array<ArrayBuffer>;
export { base64UrlDecode, base64UrlEncode, copyBytes, normalizeByteArray };
//# sourceMappingURL=encoding.d.ts.map