import type { LocalAccount, NonceManager } from "viem";
import type { Secp256k1SigningSession } from "./types.js";
/** Inputs for `toViemAccount`. */
type ToViemAccountOptions = {
    /** viem nonce manager forwarded to the account for automatic nonce handling. */
    nonceManager?: NonceManager;
};
/**
 * Adapts a secp256k1 signing session into a viem local account.
 *
 * Each signing method hashes its input with viem's own hashers and signs the
 * resulting 32-byte digest with `session.signDigest`, so signing never shows a
 * passkey prompt. The account's `address` is the EIP-55 checksummed address of
 * the session key, and `publicKey` is the 65-byte uncompressed public key as
 * hex.
 *
 * @param session - Live secp256k1 signing session that backs the account.
 * @param options - Adapter inputs.
 * @returns A viem local account with `source: "mera"` implementing
 * `signTransaction` (honoring a custom `serializer`), `signMessage` (EIP-191),
 * `signTypedData` (EIP-712), `signAuthorization` (EIP-7702), and raw-hash
 * `sign`.
 * @throws MeraError with code `SESSION_ENDED`, rejected from every signing
 * method after `session.end()` has been called.
 * @throws MeraError with code `INPUT_INVALID`, rejected from `sign` when
 * `hash` is not exactly 32 bytes.
 */
declare function toViemAccount(session: Secp256k1SigningSession, options?: ToViemAccountOptions): LocalAccount<"mera">;
export type { ToViemAccountOptions };
export { toViemAccount };
//# sourceMappingURL=viem.d.ts.map