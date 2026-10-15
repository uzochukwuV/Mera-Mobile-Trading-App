import type { CreateSigningSessionOptions, Ed25519SigningSession } from "./types.js";
/**
 * Creates a signing session from an Ed25519 private key.
 *
 * @param options - Signing session inputs.
 * @returns A live Ed25519 signing session.
 * @throws MeraError with code `INPUT_INVALID` when `privateKey` is not 32 bytes.
 */
declare function createEd25519SigningSession({ privateKey, }: CreateSigningSessionOptions): Ed25519SigningSession;
export { createEd25519SigningSession };
//# sourceMappingURL=ed25519.d.ts.map