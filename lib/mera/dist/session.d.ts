/** Session-owned signing key whose lifetime is gated by `end`. */
type SigningKey = {
    /**
     * Returns the live session-owned key.
     *
     * @throws MeraError with code `SESSION_ENDED` after `end` has been called.
     */
    use(): Uint8Array<ArrayBuffer>;
    /** Zeroes the session-owned key; later `use` calls throw. */
    end(): void;
    /** Public key derived from the session-owned key. */
    readonly publicKey: Uint8Array<ArrayBuffer>;
};
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
declare function createSigningKey(privateKey: Uint8Array, derivePublicKey: (privateKey: Uint8Array) => Uint8Array<ArrayBuffer>): SigningKey;
export { createSigningKey };
//# sourceMappingURL=session.d.ts.map