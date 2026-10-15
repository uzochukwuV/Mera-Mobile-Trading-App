import { createPasskeyWithPrfOutput, getPasskeyPrfOutput } from "./passkey.js";
import type { PasskeySecretVault } from "./types.js";
/** Inputs for `createSecretVault`. */
type CreateSecretVaultOptions = {
    /** Credential metadata plus the PRF salt and PRF output that key this secret. */
    credential: createPasskeyWithPrfOutput.Result;
    /** Secret bytes to encrypt. */
    secret: Uint8Array<ArrayBuffer>;
};
/**
 * Encrypts a secret into a passkey-protected vault.
 *
 * An AES-256-GCM encryption key is derived from the PRF output with fixed
 * HKDF info (`mera.v1.encrypt.secret`), which separates it from other keys
 * derived from the same PRF output.
 *
 * A vault is bound to its PRF output only, not to the credential ID or salt:
 * vaults encrypted with one reused PRF output share an encryption key, so each
 * secret needs a fresh salt.
 *
 * @returns A JSON-safe secret vault.
 * @throws MeraError with code `INPUT_INVALID` when the PRF output is not 32 bytes.
 * @throws MeraError with code `CRYPTO_UNAVAILABLE` when `crypto.getRandomValues` or `crypto.subtle` is unavailable.
 * @internal
 */
declare function createSecretVault({ credential, secret, }: CreateSecretVaultOptions): Promise<PasskeySecretVault>;
/** Inputs for creating a secret vault together with a new passkey. */
type CreateSecretVaultWithNewPasskeyOptions = Omit<createPasskeyWithPrfOutput.Options, "prfSalt"> & {
    /** Secret bytes to encrypt. Any non-empty length. */
    secret: Uint8Array;
};
/** Inputs for creating a secret vault with an existing passkey. */
type CreateSecretVaultWithExistingPasskeyOptions = Omit<getPasskeyPrfOutput.Options, "prfSalt"> & {
    /** Secret bytes to encrypt. Any non-empty length. */
    secret: Uint8Array;
};
/**
 * Creates a passkey and encrypts one secret into a vault.
 *
 * @param options - Passkey creation inputs and secret bytes.
 * @returns A JSON-safe secret vault containing the new credential metadata.
 * @remarks
 * Runs one creation ceremony and shows one user-verification prompt. On
 * authenticators that do not evaluate PRF during creation, also runs an
 * assertion, which shows a second.
 *
 * A fresh random PRF salt is generated internally and stored in the returned
 * vault.
 *
 * A fresh random user handle (`user.id`) is generated for the new credential,
 * so each call adds a passkey instead of replacing one.
 *
 * If the fallback ceremony or vault encryption fails, the passkey from the
 * completed creation ceremony still exists on the authenticator, but the
 * thrown error does not carry its metadata.
 * @throws MeraError with code `PRF_UNAVAILABLE` when the authenticator does not enable PRF or return a usable 32-byte PRF output.
 * @throws MeraError with code `INPUT_INVALID` when `secret` is empty.
 * @throws MeraError with code `CRYPTO_UNAVAILABLE` when `crypto.getRandomValues` or `crypto.subtle` is unavailable.
 * @throws MeraError with code `PASSKEY_OPERATION_FAILED` when WebAuthn is unavailable, cancelled, or returns an unexpected credential.
 */
declare function createSecretVaultWithNewPasskey({ secret, ...passkeyOptions }: CreateSecretVaultWithNewPasskeyOptions): Promise<PasskeySecretVault>;
/**
 * Evaluates an existing passkey and encrypts one secret into a vault.
 *
 * @param options - Passkey assertion inputs and secret bytes.
 * @returns A JSON-safe secret vault containing the selected credential metadata.
 * @remarks
 * Runs one assertion ceremony and shows one user-verification prompt.
 *
 * A fresh random PRF salt is generated internally and stored in the returned
 * vault.
 * @throws MeraError with code `PRF_UNAVAILABLE` when the authenticator does not return a usable 32-byte PRF output.
 * @throws MeraError with code `INPUT_INVALID` when `secret` is empty, or `credential.credentialId` is empty or not canonical base64url.
 * @throws MeraError with code `CRYPTO_UNAVAILABLE` when `crypto.getRandomValues` or `crypto.subtle` is unavailable.
 * @throws MeraError with code `PASSKEY_OPERATION_FAILED` when WebAuthn is unavailable, cancelled, or returns an unexpected credential.
 */
declare function createSecretVaultWithExistingPasskey({ credential, secret, ...passkeyOptions }: CreateSecretVaultWithExistingPasskeyOptions): Promise<PasskeySecretVault>;
/** Inputs for decrypting a secret vault. */
type DecryptSecretVaultOptions = {
    /** Secret vault to decrypt. */
    vault: PasskeySecretVault;
    /** WebAuthn PRF output for the vault's PRF salt. Must be exactly 32 bytes. */
    prfOutput: Uint8Array<ArrayBuffer>;
};
/**
 * Decrypts the secret from a secret vault with a PRF output.
 *
 * Decoding the vault's `nonce` and `ciphertext` strings here doubles as
 * validation for direct callers that skip `parseSecretVault`.
 *
 * @returns The decrypted secret bytes in a fresh allocation.
 * @throws MeraError with code `INPUT_INVALID` when `prfOutput` is not 32 bytes, or the vault's `nonce` or `ciphertext` is not valid base64url.
 * @throws MeraError with code `DECRYPT_FAILED` when AES-GCM authentication fails.
 * @throws MeraError with code `CRYPTO_UNAVAILABLE` when `crypto.subtle` is unavailable.
 * @internal
 */
declare function decryptSecretVault({ vault, prfOutput, }: DecryptSecretVaultOptions): Promise<Uint8Array<ArrayBuffer>>;
/**
 * Parses and validates untrusted secret-vault JSON or objects.
 *
 * Only version 1 vaults are accepted. The credential ID, PRF salt, nonce, and
 * ciphertext are validated as canonical base64url and length-checked. Unknown
 * fields are dropped from the returned vault.
 *
 * @param value - Secret vault as JSON text or an untrusted object.
 * @returns A validated secret vault.
 * @throws MeraError with code `VAULT_FORMAT_INVALID` when required structure, version, or encoded data is invalid.
 */
declare function parseSecretVault(value: unknown): PasskeySecretVault;
/** Inputs for decrypting a secret vault with a passkey. */
type DecryptSecretVaultWithPasskeyOptions = Omit<getPasskeyPrfOutput.Options, "credential" | "prfSalt"> & {
    /** Secret vault to decrypt. */
    vault: PasskeySecretVault;
};
/**
 * Performs the passkey assertion for a vault and decrypts its secret.
 *
 * @param options - Relying party ID and vault.
 * @returns The decrypted secret bytes in a fresh allocation.
 * @remarks
 * Runs one assertion ceremony and shows one user-verification prompt. The
 * assertion is restricted to the credential stored in the vault.
 * @throws MeraError with code `VAULT_FORMAT_INVALID` when the vault's required structure, version, or encoded data is invalid.
 * @throws MeraError with code `PRF_UNAVAILABLE` when the authenticator does not return a usable 32-byte PRF output.
 * @throws MeraError with code `DECRYPT_FAILED` when AES-GCM authentication fails.
 * @throws MeraError with code `CRYPTO_UNAVAILABLE` when `crypto.getRandomValues` or `crypto.subtle` is unavailable.
 * @throws MeraError with code `PASSKEY_OPERATION_FAILED` when WebAuthn is unavailable, cancelled, or returns an unexpected credential.
 */
declare function decryptSecretVaultWithPasskey({ vault, ...passkeyOptions }: DecryptSecretVaultWithPasskeyOptions): Promise<Uint8Array<ArrayBuffer>>;
export type { CreateSecretVaultWithExistingPasskeyOptions, CreateSecretVaultWithNewPasskeyOptions, DecryptSecretVaultWithPasskeyOptions, };
export { createSecretVault, createSecretVaultWithExistingPasskey, createSecretVaultWithNewPasskey, decryptSecretVault, decryptSecretVaultWithPasskey, parseSecretVault, };
//# sourceMappingURL=secret.d.ts.map