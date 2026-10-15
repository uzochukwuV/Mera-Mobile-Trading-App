import type { EvmAddress } from "../types.js";
/**
 * Derives the EIP-55 checksummed EVM address for a secp256k1 public key.
 *
 * @param publicKey - A compressed or uncompressed secp256k1 public key.
 * @returns The EIP-55 mixed-case checksummed EVM address.
 * @throws MeraError with code `INPUT_INVALID` when `publicKey` is not valid secp256k1.
 */
declare function getEvmAddress(publicKey: Uint8Array): EvmAddress;
export { getEvmAddress };
//# sourceMappingURL=evm.d.ts.map