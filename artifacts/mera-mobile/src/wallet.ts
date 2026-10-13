import {
  createPasskeyWithPrfOutput,
  createSecp256k1SigningSession,
  type EvmAddress,
  getEvmAddress,
  getPasskeyPrfOutput,
  isMeraError,
  type Secp256k1SigningSession,
} from "@category-labs/mera";
import { reactNativeWebAuthnClient } from "@category-labs/mera/react-native-webauthn-client";
import {
  deriveEvmPrivateKey,
  mnemonicToSeed,
  prfOutputToMnemonic,
} from "@category-labs/mera-demo-shared/hd";
import Constants, { AppOwnership } from "expo-constants";
import { Platform } from "react-native";
import type { PasskeyError } from "react-native-passkey";
import { BaseError as ViemError } from "viem";
import { rpId } from "./config";
import {
  readStoredPrfResult,
  saveStoredAccount,
  storePrfResult,
} from "./storage";

const RP_NAME = "mera demo";
const USER_NAME = "nad";

const passkeyDisplayName = (): string =>
  `Account ${new Date().toLocaleString()}`;

type Wallet = {
  address: EvmAddress;
  credentialId: string;
  session: Secp256k1SigningSession;
};

async function createAccount(): Promise<Wallet> {
  await assertPasskeyReady();
  const created = await createPasskeyWithPrfOutput({
    rp: { id: rpId, name: RP_NAME },
    user: { name: USER_NAME, displayName: passkeyDisplayName() },
    webAuthnClient: reactNativeWebAuthnClient,
  });
  return storeAndOpenWallet(created);
}

/**
 * Signs in with a ceremony that pins no credential, so the platform can offer
 * every passkey for the relying party.
 */
async function signIn(): Promise<Wallet> {
  await assertPasskeyReady();
  const asserted = await getPasskeyPrfOutput({
    rpId,
    webAuthnClient: reactNativeWebAuthnClient,
  });
  return storeAndOpenWallet(asserted);
}

/**
 * Stores the ceremony result, derives the wallet, and records the account
 * metadata for the locked state. A failed metadata write ends the session
 * before rethrowing, so the signing key does not outlive the error.
 */
async function storeAndOpenWallet(
  result: getPasskeyPrfOutput.Result,
): Promise<Wallet> {
  await storePrfResult(result);
  const wallet = toWallet(result);
  try {
    await saveStoredAccount({
      address: wallet.address,
      credentialId: wallet.credentialId,
    });
  } catch (error) {
    wallet.session.end();
    throw error;
  }
  return wallet;
}

/**
 * Restores the wallet from the stored PRF output. Reading the store asks for
 * a biometric or device credential; no passkey prompt appears.
 */
async function unlockStoredWallet(): Promise<Wallet | undefined> {
  const stored = await readStoredPrfResult();
  return stored === undefined ? undefined : toWallet(stored);
}

/**
 * Clears reachable key buffers after derivation. BIP-32 keeps internal
 * path-node keys until garbage collection.
 */
function toWallet({
  credentialId,
  prfOutput,
}: getPasskeyPrfOutput.Result): Wallet {
  const seed = mnemonicToSeed(prfOutputToMnemonic(prfOutput));
  prfOutput.fill(0);
  // The session copies what it is given, so this array is the demo's to clear.
  let privateKey: Uint8Array | undefined;

  try {
    privateKey = deriveEvmPrivateKey(seed, 0);
    const session = createSecp256k1SigningSession({ privateKey });

    return {
      address: getEvmAddress(session.publicKey),
      credentialId,
      session,
    };
  } finally {
    seed.fill(0);
    privateKey?.fill(0);
  }
}

/**
 * Re-derives the recovery phrase in a ceremony pinned to the stored
 * credential.
 */
async function revealMnemonic(credentialId: string): Promise<string> {
  const { prfOutput } = await getPasskeyPrfOutput({
    rpId,
    credential: { credentialId },
    webAuthnClient: reactNativeWebAuthnClient,
  });

  try {
    return prfOutputToMnemonic(prfOutput);
  } finally {
    prfOutput.fill(0);
  }
}

function describeError(error: unknown): string {
  if (isMeraError(error)) {
    switch (error.code) {
      case "PRF_UNAVAILABLE":
        return "This passkey provider does not support the WebAuthn PRF extension. iOS needs 18 or newer; on Android, Google Password Manager and 1Password both supply it.";
      case "PASSKEY_OPERATION_FAILED":
        return describePasskeyFailure(error.cause);
      case "SESSION_ENDED":
        return "The session has ended. Connect again.";
      case "CRYPTO_UNAVAILABLE":
        return "The runtime provides no CSPRNG.";
      default:
        return error.message;
    }
  }

  // A viem error's `message` appends the request URL, body, and hex payload;
  // `shortMessage` is its one-line summary, e.g. "Transaction creation failed."
  if (error instanceof ViemError) return error.shortMessage;
  return error instanceof Error ? error.message : String(error);
}

function describePasskeyFailure(cause: unknown): string {
  // react-native-passkey rejects with a PasskeyError-shaped object, not Error.
  const { error, message } = (cause ?? {}) as Partial<PasskeyError>;
  const nativeDetails = getNativePasskeyErrorDetails(cause);

  switch (error) {
    // react-native-passkey replaces the platform's association error with a
    // misleading message about missing credentials.
    case "RequestFailed":
      return `The platform refused a passkey for ${rpId}. On a first run that is usually the association files: check the host serves them and that they name this app.`;
    case "NoCredentials":
      return "No passkey for this host reached this device. Create one, or check that the one from the web demo synced to this provider.";
    default:
      break;
  }
  if (nativeDetails.toLowerCase().includes("cancel")) {
    return "Passkey prompt cancelled. You can try again when you're ready.";
  }
  if (typeof message === "string" && message.length > 0) {
    return nativeDetails && !message.includes(nativeDetails)
      ? `${message} Native error: ${nativeDetails}`
      : message;
  }
  return nativeDetails
    ? `The passkey request failed. Native error: ${nativeDetails}`
    : "The passkey request failed.";
}

/** Walks a failure cause chain (Errors, plain objects, strings) into one line. */
function getNativePasskeyErrorDetails(error: unknown): string {
  const details: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof Error) {
      const shaped = current as Error & {
        code?: unknown;
        error?: unknown;
        cause?: unknown;
      };
      const code = [shaped.code, shaped.error].find(
        (part): part is string => typeof part === "string",
      );
        const text = shaped.message.trim();
      const name =
        shaped.name && shaped.name !== "Error" ? shaped.name : undefined;
      const detail = [name, code, text && text !== code ? text : undefined]
        .filter((part): part is string => Boolean(part))
        .join(": ");
      if (detail && !details.includes(detail)) details.push(detail);
      current = shaped.cause;
      continue;
    }
    if (typeof current === "object") {
      const shaped = current as {
        code?: unknown;
        error?: unknown;
        message?: unknown;
        cause?: unknown;
      };
      const code = [shaped.code, shaped.error].find(
        (part): part is string => typeof part === "string",
      );
      const text =
        typeof shaped.message === "string" ? shaped.message.trim() : undefined;
      const detail = [code, text && text !== code ? text : undefined]
        .filter((part): part is string => Boolean(part))
        .join(": ");
      if (detail && !details.includes(detail)) details.push(detail);
      current = shaped.cause;
      continue;
    }
    if (typeof current === "string" && current.trim()) {
      details.push(current.trim());
    }
    break;
  }
  return details.join(" → ");
}

/** Fails fast with an actionable message when passkeys cannot work here. */
async function assertPlatformSupport(): Promise<void> {
  if (
    Platform.OS !== "web" &&
    Constants.appOwnership === AppOwnership.Expo
  ) {
    throw new Error(
      "Expo Go does not include the native passkey module. Use a development build, then retry.",
    );
  }
  if (Platform.OS === "ios" && Number(Platform.Version) < 18) {
    throw new Error("Passkey wallets require iOS 18 or later.");
  }
  if (Platform.OS === "android" && Number(Platform.Version) < 28) {
    throw new Error("Passkey wallets require Android 9 or later.");
  }
  if (Platform.OS !== "web") {
    const { Passkey } = await import("react-native-passkey");
    if (!Passkey.isSupported()) {
      throw new Error(
        "Passkeys are not available on this device. Enable a screen lock and try a supported device.",
      );
    }
  }
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    !window.PublicKeyCredential
  ) {
    throw new Error("This browser does not support passkeys. Try a supported browser.");
  }
}

/**
 * Verifies the RP domain actually associates this app before the
 * ceremony runs — the #1 cause of opaque "request failed" errors.
 */
async function assertNativeRpAssociation(id: string): Promise<void> {
  if (Platform.OS === "web") return;
  const isAndroid = Platform.OS === "android";
  const associationPath = isAndroid
    ? "/.well-known/assetlinks.json"
    : "/.well-known/apple-app-site-association";
  let response: Response;
  try {
    response = await fetch(`https://${id}${associationPath}`, {
      redirect: "manual",
    });
  } catch {
    throw new Error(
      `Could not reach https://${id}${associationPath}. Publish the passkey association file on the RP domain, then retry.`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `The passkey association file at https://${id}${associationPath} must return HTTP 200. Check the RP domain's association configuration.`,
    );
  }
  let association: unknown;
  try {
    association = await response.json();
  } catch {
    throw new Error(
      `The passkey association file at https://${id}${associationPath} did not return valid JSON.`,
    );
  }
  if (isAndroid) {
    const packageName =
      Constants.expoConfig?.android?.package ?? "xyz.category.mera.demo";
    const entries = Array.isArray(association) ? association : [];
    const associated = entries.some((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const typed = entry as {
        relation?: unknown;
        target?: {
          namespace?: string;
          package_name?: string;
          sha256_cert_fingerprints?: unknown;
        };
      };
      const relations = Array.isArray(typed.relation) ? typed.relation : [];
      const target = typed.target;
      return (
        relations.includes("delegate_permission/common.get_login_creds") &&
        target?.namespace === "android_app" &&
        target.package_name === packageName &&
        Array.isArray(target.sha256_cert_fingerprints) &&
        target.sha256_cert_fingerprints.length > 0
      );
    });
    if (!associated) {
      throw new Error(
        `Android passkeys are not associated with ${packageName}. Add the signing-certificate SHA-256 fingerprint to the RP domain's assetlinks.json, rebuild, and retry.`,
      );
    }
    return;
  }
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  const webcredentials = (
    association as { webcredentials?: { apps?: unknown } } | null
  )?.webcredentials;
  const apps = Array.isArray(webcredentials?.apps) ? webcredentials.apps : [];
  if (
    bundleId &&
    !apps.some(
      (app) => typeof app === "string" && app.endsWith(`.${bundleId}`),
    )
  ) {
    throw new Error(
      `iOS passkeys are not associated with ${bundleId}. Add the Apple team and bundle ID to the RP domain's apple-app-site-association file, rebuild, and retry.`,
    );
  }
}

async function assertPasskeyReady(): Promise<void> {
  await assertPlatformSupport();
  await assertNativeRpAssociation(rpId);
}

export type { Wallet };
export {
  createAccount,
  describeError,
  revealMnemonic,
  signIn,
  unlockStoredWallet,
};
