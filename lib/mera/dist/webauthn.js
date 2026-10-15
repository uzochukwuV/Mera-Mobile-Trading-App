import { normalizeByteArray } from "./encoding.js";
import { MeraError } from "./errors.js";
const browserWebAuthnClient = {
    async createCredential(request) {
        const credential = await globalThis.navigator?.credentials?.create({
            publicKey: {
                rp: request.rp,
                user: request.user,
                challenge: request.challenge,
                pubKeyCredParams: request.algorithms.map((alg) => ({
                    type: "public-key",
                    alg,
                })),
                ...(request.timeout !== undefined ? { timeout: request.timeout } : {}),
                attestation: request.attestation,
                authenticatorSelection: {
                    residentKey: request.residentKey,
                    // WebAuthn Level 1's boolean, kept in step with residentKey for
                    // authenticators that still read it.
                    requireResidentKey: true,
                    userVerification: request.userVerification,
                },
                extensions: {
                    prf: { eval: { first: request.prfSalt } },
                },
            },
        });
        const publicKeyCredential = assertPublicKeyCredential(credential);
        const prf = publicKeyCredential.getClientExtensionResults().prf;
        const response = publicKeyCredential.response;
        const transports = typeof response.getTransports === "function"
            ? response.getTransports()
            : undefined;
        const first = prf?.results?.first;
        return {
            credentialId: new Uint8Array(publicKeyCredential.rawId),
            ...(transports !== undefined ? { transports } : {}),
            prfEnabled: prf?.enabled === true,
            ...(first
                ? {
                    prfOutput: normalizeByteArray(first, {
                        name: "PRF output",
                        code: "PRF_UNAVAILABLE",
                    }),
                }
                : {}),
        };
    },
    async getCredential(request) {
        const { allowCredential } = request;
        const credential = await globalThis.navigator?.credentials?.get({
            publicKey: {
                rpId: request.rpId,
                challenge: request.challenge,
                ...(request.timeout !== undefined ? { timeout: request.timeout } : {}),
                userVerification: request.userVerification,
                extensions: { prf: { eval: { first: request.prfSalt } } },
                ...(allowCredential !== undefined
                    ? {
                        allowCredentials: [
                            {
                                id: allowCredential.credentialId,
                                type: "public-key",
                                ...(allowCredential.transports !== undefined
                                    ? {
                                        // The library's transport type admits future strings
                                        // beyond lib.dom's closed AuthenticatorTransport union.
                                        // The cast is safe: transports are hints, and WebAuthn
                                        // ignores values it does not recognize.
                                        transports: allowCredential.transports,
                                    }
                                    : {}),
                            },
                        ],
                    }
                    : {}),
            },
        });
        const publicKeyCredential = assertPublicKeyCredential(credential);
        const first = publicKeyCredential.getClientExtensionResults().prf?.results?.first;
        return {
            credentialId: new Uint8Array(publicKeyCredential.rawId),
            ...(first
                ? {
                    prfOutput: normalizeByteArray(first, {
                        name: "PRF output",
                        code: "PRF_UNAVAILABLE",
                    }),
                }
                : {}),
        };
    },
};
function assertPublicKeyCredential(credential) {
    if (credential?.type !== "public-key" ||
        !("rawId" in credential) ||
        !("getClientExtensionResults" in credential) ||
        typeof credential.getClientExtensionResults !== "function") {
        throw new MeraError("PASSKEY_OPERATION_FAILED", "WebAuthn returned no usable public key credential");
    }
    return credential;
}
export { browserWebAuthnClient };
//# sourceMappingURL=webauthn.js.map