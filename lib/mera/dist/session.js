import { copyBytes } from "./encoding.js";
import { MeraError } from "./errors.js";
/**
 * Copies a private key into a session-owned snapshot and derives its public
 * key.
 *
 * The snapshot is zeroed by `end` or, when `derivePublicKey` throws, before
 * the error is rethrown.
 *
 * @param derivePublicKey - Derives the public key from the owned snapshot; a throw doubles as private-key validation.
 * @internal
 */
function createSigningKey(privateKey, derivePublicKey) {
    let activePrivateKey;
    try {
        activePrivateKey = copyBytes(privateKey);
        const publicKey = derivePublicKey(activePrivateKey);
        return {
            use() {
                return requireActive(activePrivateKey);
            },
            end() {
                if (activePrivateKey !== undefined) {
                    activePrivateKey.fill(0);
                    activePrivateKey = undefined;
                }
            },
            publicKey,
        };
    }
    catch (error) {
        activePrivateKey?.fill(0);
        throw error;
    }
}
/**
 * Returns the active private key.
 *
 * @throws MeraError with code `SESSION_ENDED` when `privateKey` is undefined.
 */
function requireActive(privateKey) {
    if (privateKey === undefined) {
        throw new MeraError("SESSION_ENDED", "Signing session has ended");
    }
    return privateKey;
}
export { createSigningKey };
//# sourceMappingURL=session.js.map