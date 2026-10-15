import type { PasskeyCredentialTransport, PasskeyRelyingParty } from "./types.js";
type WebAuthnClient = {
    readonly createCredential: (request: WebAuthnClient.CreateCredentialRequest) => Promise<WebAuthnClient.CreateCredentialResult>;
    readonly getCredential: (request: WebAuthnClient.GetCredentialRequest) => Promise<WebAuthnClient.GetCredentialResult>;
};
declare namespace WebAuthnClient {
    /** Ceremony parameters for creating one passkey and evaluating its PRF. */
    type CreateCredentialRequest = {
        /** Relying party identity for the new credential. */
        rp: PasskeyRelyingParty;
        /** User identity stored with the discoverable credential. */
        user: {
            id: Uint8Array<ArrayBuffer>;
            name: string;
            displayName: string;
        };
        challenge: Uint8Array<ArrayBuffer>;
        /** COSE algorithm identifiers for the credential key, most preferred first. */
        algorithms: readonly number[];
        /** PRF salt to evaluate during creation, as 32 raw bytes. */
        prfSalt: Uint8Array<ArrayBuffer>;
        /** Discoverable-credential requirement. */
        residentKey: "required";
        userVerification: "required";
        attestation: "none";
        /** Timeout in milliseconds. Platform defaults apply when omitted. */
        timeout?: number;
    };
    /** Outcome of one credential-creation ceremony. */
    type CreateCredentialResult = {
        /** Credential ID of the new passkey, as raw bytes. */
        credentialId: Uint8Array;
        /** Authenticator transports reported for the new credential. */
        transports?: readonly PasskeyCredentialTransport[];
        /** Whether the authenticator enabled PRF for the new credential. */
        prfEnabled: boolean;
        /** First PRF output, when the authenticator evaluated the salt during creation. */
        prfOutput?: Uint8Array;
    };
    /** Credential an assertion is restricted to. */
    type AllowCredential = {
        credentialId: Uint8Array<ArrayBuffer>;
        /** Authenticator transports, which the platform reads as hints. */
        transports?: readonly PasskeyCredentialTransport[];
    };
    /** Ceremony parameters for asserting a passkey and evaluating its PRF. */
    type GetCredentialRequest = {
        /** Relying party ID the assertion targets. */
        rpId: string;
        challenge: Uint8Array<ArrayBuffer>;
        /**
         * Credential the assertion is restricted to. When omitted, any discoverable
         * credential for `rpId` may answer.
         */
        allowCredential?: AllowCredential;
        /** PRF salt to evaluate, as 32 raw bytes. */
        prfSalt: Uint8Array<ArrayBuffer>;
        userVerification: "required";
        /** Timeout in milliseconds. Platform defaults apply when omitted. */
        timeout?: number;
    };
    /** Outcome of one assertion ceremony. */
    type GetCredentialResult = {
        /** Credential ID that answered, as raw bytes. */
        credentialId: Uint8Array;
        /** First PRF output for the requested salt. */
        prfOutput?: Uint8Array;
    };
}
declare const browserWebAuthnClient: WebAuthnClient;
export type { WebAuthnClient };
export { browserWebAuthnClient };
//# sourceMappingURL=webauthn.d.ts.map