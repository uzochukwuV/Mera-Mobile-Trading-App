import type { CreateSigningSessionOptions, Secp256k1SigningSession } from "./types.js";
/**
 * Converts a compressed or uncompressed secp256k1 public key to uncompressed form.
 *
 * @returns A 65-byte public key with the `0x04` uncompressed prefix.
 * @throws MeraError with code `INPUT_INVALID` when the key length, prefix, or curve point is invalid.
 * @internal
 */
declare function normalizeSecp256k1PublicKey(publicKey: Uint8Array): Uint8Array<ArrayBuffer>;
/**
 * Creates a signing session from a secp256k1 private key.
 *
 * @param options - Signing session inputs.
 * @returns A live secp256k1 signing session.
 * @throws MeraError with code `INPUT_INVALID` when `privateKey` is not a valid secp256k1 scalar.
 */
declare function createSecp256k1SigningSession({ privateKey, }: CreateSigningSessionOptions): Secp256k1SigningSession;
export { createSecp256k1SigningSession, normalizeSecp256k1PublicKey };
//# sourceMappingURL=secp256k1.d.ts.map