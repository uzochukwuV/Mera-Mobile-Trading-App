import type { SolanaAddress } from "../types.js";
/**
 * Derives the base58-encoded Solana address for an Ed25519 public key.
 *
 * @param publicKey - A 32-byte Ed25519 public key.
 * @returns The base58-encoded Solana address.
 * @throws MeraError with code `INPUT_INVALID` when `publicKey` is not 32 bytes.
 */
declare function getSolanaAddress(publicKey: Uint8Array): SolanaAddress;
export { getSolanaAddress };
//# sourceMappingURL=solana.d.ts.map