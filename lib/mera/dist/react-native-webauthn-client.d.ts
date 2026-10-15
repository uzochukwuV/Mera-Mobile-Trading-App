/**
 * @file Importing the Passkey platform API also imports React Native, which
 * does not work in tests. The client logic lives in a separate module so tests
 * can supply a stub.
 */
import type { WebAuthnClient } from "./webauthn.js";
declare const reactNativeWebAuthnClient: WebAuthnClient;
export { reactNativeWebAuthnClient };
//# sourceMappingURL=react-native-webauthn-client.d.ts.map