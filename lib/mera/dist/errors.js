/** Error thrown by this package. */
class MeraError extends Error {
    /** Stable machine-readable category for the failure. */
    code;
    constructor(code, message, options) {
        super(message, options);
        this.name = "MeraError";
        this.code = code;
    }
}
/** Returns `true` when `error` is a `MeraError`. */
function isMeraError(error) {
    return error instanceof MeraError;
}
export { isMeraError, MeraError };
//# sourceMappingURL=errors.js.map