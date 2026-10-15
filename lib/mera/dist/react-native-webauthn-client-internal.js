import { base64UrlDecode, base64UrlEncode, normalizeByteArray, } from "./encoding.js";
function createReactNativeWebAuthnClient(platformApi) {
    return {
        async createCredential(request) {
            // The general iOS entry point can offer a security key, whose result has
            // no PRF output. Android treats the platform-only flag as a no-op.
            const created = await platformApi.createPlatformKey({
                rp: request.rp,
                user: {
                    id: base64UrlEncode(request.user.id),
                    name: request.user.name,
                    displayName: request.user.displayName,
                },
                challenge: base64UrlEncode(request.challenge),
                pubKeyCredParams: request.algorithms.map((alg) => ({
                    type: "public-key",
                    alg,
                })),
                authenticatorSelection: {
                    residentKey: request.residentKey,
                    requireResidentKey: true,
                    userVerification: request.userVerification,
                },
                attestation: request.attestation,
                extensions: prfExtension(request.prfSalt),
                ...(request.timeout !== undefined ? { timeout: request.timeout } : {}),
            });
            const prf = created.clientExtensionResults?.prf;
            const prfOutput = readPrfOutput(prf?.results?.first);
            const transports = created.response.transports;
            return {
                credentialId: decodeNativeBase64Url(created.rawId, "Credential ID", "PASSKEY_OPERATION_FAILED"),
                ...(transports !== undefined ? { transports } : {}),
                prfEnabled: prf?.enabled === true,
                ...(prfOutput !== undefined ? { prfOutput } : {}),
            };
        },
        async getCredential(request) {
            const { allowCredential } = request;
            const asserted = await platformApi.getPlatformKey({
                rpId: request.rpId,
                challenge: base64UrlEncode(request.challenge),
                userVerification: request.userVerification,
                extensions: prfExtension(request.prfSalt),
                ...(allowCredential !== undefined
                    ? {
                        allowCredentials: [
                            {
                                type: "public-key",
                                id: base64UrlEncode(allowCredential.credentialId),
                                ...(allowCredential.transports !== undefined
                                    ? {
                                        transports: [
                                            ...allowCredential.transports,
                                        ],
                                    }
                                    : {}),
                            },
                        ],
                    }
                    : {}),
                ...(request.timeout !== undefined ? { timeout: request.timeout } : {}),
            });
            const prfOutput = readPrfOutput(asserted.clientExtensionResults?.prf?.results?.first);
            return {
                credentialId: decodeNativeBase64Url(asserted.rawId ?? asserted.id, "Credential ID", "PASSKEY_OPERATION_FAILED"),
                ...(prfOutput !== undefined ? { prfOutput } : {}),
            };
        },
    };
}
/**
 * react-native-passkey rewrites binary request fields on Android. On iOS, the
 * PRF salt reaches Swift as the index-keyed object produced by stringifying a
 * Uint8Array. Keeping the salt as bytes is the one shape both platforms read.
 */
function prfExtension(prfSalt) {
    return { prf: { eval: { first: prfSalt } } };
}
function decodeNativeBase64Url(value, name, code) {
    return base64UrlDecode(value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), { name, code });
}
function readPrfOutput(value) {
    if (value === undefined)
        return undefined;
    if (typeof value === "string") {
        return decodeNativeBase64Url(value, "PRF output", "PRF_UNAVAILABLE");
    }
    return normalizeByteArray(value, {
        name: "PRF output",
        code: "PRF_UNAVAILABLE",
    });
}
export { createReactNativeWebAuthnClient };
//# sourceMappingURL=react-native-webauthn-client-internal.js.map