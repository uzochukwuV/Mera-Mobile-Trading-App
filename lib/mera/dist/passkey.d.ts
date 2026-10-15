import type { PasskeyCredentialMetadata, PasskeyCredentialTransport, PasskeyRelyingParty } from "./types.js";
import { type WebAuthnClient } from "./webauthn.js";
/**
 * Creates a discoverable, user-verified passkey that requires WebAuthn PRF
 * support and returns the first PRF output.
 *
 * @param options - Passkey creation inputs.
 * @returns Credential metadata and the first PRF output.
 * @remarks
 * Runs one creation ceremony and shows one user-verification prompt. On
 * authenticators that do not evaluate PRF during creation, a fallback
 * assertion evaluates the same salt and shows a second prompt.
 *
 * WebAuthn challenges and the credential's user handle (`user.id`) are
 * generated internally, 32 random bytes each. An authenticator overwrites a
 * discoverable credential that has the same `rp.id` and `user.id`, so a fresh
 * handle per call adds a passkey instead of replacing one.
 *
 * The credential is requested with fixed parameters: ES256 or RS256 key types,
 * attestation `"none"`, a required resident key, and required user
 * verification ({@link getPasskeyPrfOutput} explains the requirement).
 *
 * Any failure after the creation ceremony completes leaves the passkey on the
 * authenticator, but the thrown error does not carry its metadata.
 * @throws MeraError with code `PRF_UNAVAILABLE` when the authenticator reports no PRF support and returns no create-time output, returns an output that is not 32 bytes, or returns none on the fallback ceremony.
 * @throws MeraError with code `INPUT_INVALID` when an explicit `prfSalt` is not 32 bytes.
 * @throws MeraError with code `CRYPTO_UNAVAILABLE` when `crypto.getRandomValues` is unavailable.
 * @throws MeraError with code `PASSKEY_OPERATION_FAILED` when WebAuthn is unavailable, cancelled, or returns an unexpected credential.
 */
declare function createPasskeyWithPrfOutput({ rp, user, timeout, prfSalt, webAuthnClient, }: createPasskeyWithPrfOutput.Options): Promise<createPasskeyWithPrfOutput.Result>;
declare namespace createPasskeyWithPrfOutput {
    /** Inputs for creating a passkey and obtaining its first WebAuthn PRF output. */
    type Options = {
        /**
         * Relying party identity passed to WebAuthn. `id` is required so the
         * fallback assertion can target the same relying party.
         */
        rp: PasskeyRelyingParty;
        /** User identity passed to WebAuthn. */
        user: {
            /** User name displayed or stored by the authenticator. */
            name: string;
            /** Human-readable display name for the authenticator UI. */
            displayName: string;
        };
        /** WebAuthn timeout in milliseconds. Platform defaults apply when omitted. */
        timeout?: number;
        /**
         * 32-byte PRF salt evaluated during creation, or by the fallback assertion.
         * Defaults to the fixed salt documented on {@link getPasskeyPrfOutput}.
         */
        prfSalt?: Uint8Array;
        /**
         * Client that runs the WebAuthn ceremonies. Defaults to the built-in browser
         * client, which calls `navigator.credentials`.
         */
        webAuthnClient?: WebAuthnClient;
    };
    /** Result of creating a passkey together with its first PRF output. */
    type Result = PasskeyCredentialMetadata & {
        /**
         * PRF salt that WebAuthn evaluated. Always 32 bytes, in a fresh allocation.
         */
        readonly prfSalt: Uint8Array<ArrayBuffer>;
        /** First WebAuthn PRF output for `prfSalt`. Always 32 bytes. */
        readonly prfOutput: Uint8Array<ArrayBuffer>;
    };
}
/**
 * Requests a passkey PRF evaluation and returns the first output.
 *
 * @param options - Passkey PRF request inputs.
 * @returns The selected credential ID and first WebAuthn PRF output.
 * @remarks
 * Runs one assertion ceremony and shows one user-verification prompt.
 *
 * The WebAuthn challenge is generated internally.
 *
 * The default salt is `sha256("mera.prf.salt.v1")` and will not change across
 * library versions. The PRF output is a deterministic function of the
 * credential, `rpId`, and salt; a different salt yields an unrelated output.
 *
 * The assertion requires user verification, and the requirement is not
 * configurable. User verification is the authenticator's local check; the
 * gesture depends on the platform (a biometric, a device PIN, or a password).
 * Authenticators built on CTAP's `hmac-secret` keep two PRFs per credential,
 * one for user-verified requests and one for the rest; WebAuthn exposes only
 * the user-verified PRF and overrides a weaker `userVerification` setting
 * when evaluating it, so a configurable setting could neither change the PRF
 * output nor skip the check.
 * @see {@link https://www.w3.org/TR/webauthn-3/#prf-extension | WebAuthn: the PRF extension}
 * @see {@link https://www.w3.org/TR/webauthn-3/#enumdef-userverificationrequirement | WebAuthn: UserVerificationRequirement}
 * @throws MeraError with code `PRF_UNAVAILABLE` when the authenticator does not return a usable 32-byte PRF output.
 * @throws MeraError with code `INPUT_INVALID` when an explicit `prfSalt` is not 32 bytes, or `credential.credentialId` is empty or not canonical base64url.
 * @throws MeraError with code `CRYPTO_UNAVAILABLE` when `crypto.getRandomValues` is unavailable.
 * @throws MeraError with code `PASSKEY_OPERATION_FAILED` when WebAuthn is unavailable, cancelled, or returns an unexpected credential.
 */
declare function getPasskeyPrfOutput({ rpId, credential: allowCredential, prfSalt, timeout, webAuthnClient, }: getPasskeyPrfOutput.Options): Promise<getPasskeyPrfOutput.Result>;
declare namespace getPasskeyPrfOutput {
    /** Inputs for requesting the first WebAuthn PRF output from a passkey. */
    type Options = {
        /** Relying party ID for the WebAuthn assertion. */
        rpId: string;
        /**
         * Credential metadata to restrict the assertion to one passkey. When
         * omitted, WebAuthn may choose any discoverable credential for the relying
         * party.
         */
        credential?: PasskeyCredentialMetadata;
        /**
         * PRF salt as 32 raw bytes. Defaults to the fixed salt documented on
         * {@link getPasskeyPrfOutput}.
         */
        prfSalt?: Uint8Array;
        /** WebAuthn timeout in milliseconds. Platform defaults apply when omitted. */
        timeout?: number;
        /**
         * Client that runs the WebAuthn ceremony. Defaults to the built-in browser
         * client, which calls `navigator.credentials`.
         */
        webAuthnClient?: WebAuthnClient;
    };
    /** Result of a passkey assertion with the WebAuthn PRF extension. */
    type Result = {
        /** Credential ID selected by the platform, as canonical unpadded base64url. */
        readonly credentialId: string;
        /** First PRF output from WebAuthn. Always 32 bytes. */
        readonly prfOutput: Uint8Array<ArrayBuffer>;
    };
}
declare function toCredentialMetadata(credentialId: string, transports: readonly PasskeyCredentialTransport[] | undefined): PasskeyCredentialMetadata;
export { createPasskeyWithPrfOutput, getPasskeyPrfOutput, toCredentialMetadata, };
//# sourceMappingURL=passkey.d.ts.map