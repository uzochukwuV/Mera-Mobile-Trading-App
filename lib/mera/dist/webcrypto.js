import { MeraError } from "./errors.js";
function randomBytes(length) {
    const crypto = globalThis.crypto;
    if (!crypto?.getRandomValues) {
        throw new MeraError("CRYPTO_UNAVAILABLE", "crypto.getRandomValues is unavailable");
    }
    const output = new Uint8Array(length);
    crypto.getRandomValues(output);
    return output;
}
function getSubtleCrypto() {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) {
        throw new MeraError("CRYPTO_UNAVAILABLE", "crypto.subtle is unavailable");
    }
    return subtle;
}
export { getSubtleCrypto, randomBytes };
//# sourceMappingURL=webcrypto.js.map