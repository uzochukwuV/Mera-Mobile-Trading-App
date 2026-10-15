import type { Passkey } from "react-native-passkey";
import type { WebAuthnClient } from "./webauthn.js";
type PlatformApi = Pick<typeof Passkey, "createPlatformKey" | "getPlatformKey">;
declare function createReactNativeWebAuthnClient(platformApi: PlatformApi): WebAuthnClient;
export { createReactNativeWebAuthnClient };
//# sourceMappingURL=react-native-webauthn-client-internal.d.ts.map