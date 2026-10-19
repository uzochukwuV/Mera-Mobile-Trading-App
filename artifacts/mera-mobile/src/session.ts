import Constants from "expo-constants";
import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from "expo-secure-store";

// Silent Supabase anonymous auth (appflow S2): the transport identity
// behind every backend call. Raw GoTrue REST — no extra dependency.
// The user only ever sees the mera passkey ceremony.

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
const SUPABASE_URL =
  typeof extra.supabaseUrl === "string" ? extra.supabaseUrl : "";
const SUPABASE_ANON_KEY =
  typeof extra.supabaseAnonKey === "string" ? extra.supabaseAnonKey : "";

const SESSION_KEY = "perpl.supabase.session.v1";
const REFRESH_MARGIN_MS = 60_000;

type SupaSession = {
  access_token: string;
  refresh_token: string;
  expires_at_ms: number;
  user_id: string;
  /** Set after a 401: rotate on the next call even if not near expiry. */
  force_refresh?: boolean;
};

/**
 * Raised when the stored identity can no longer be used.
 *
 * The anonymous Supabase user is the owner of every server-side row
 * (trading keys, copy settings, equity snapshots). A new anonymous
 * signup therefore is not a transparent retry: it is a different
 * account, and the previous one's keys become invisible. So once a
 * session exists, a failed refresh is surfaced instead of quietly
 * minting a replacement identity.
 */
export class SessionExpiredError extends Error {
  readonly code = "session_expired";

  constructor(
    message = "This device's session has expired. Sign out, sign back in with your passkey, then reconnect your trading key.",
  ) {
    super(message);
    this.name = "SessionExpiredError";
  }
}

function isBackendConfigured(): boolean {
  return SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
}

function getSupabaseConfig(): { url: string; anonKey: string } {
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

// In-memory fallback so web / restricted runtimes still work.
const memoryStore = new Map<string, string>();

async function storeGet(key: string): Promise<string | null> {
  try {
    return await getItemAsync(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function storeSet(key: string, value: string): Promise<void> {
  try {
    await setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function storeDelete(key: string): Promise<void> {
  try {
    await deleteItemAsync(key);
  } catch {
    memoryStore.delete(key);
  }
}

async function supaFetch(
  path: string,
  init?: { method?: string; body?: unknown; token?: string },
): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  let data: Record<string, unknown> | null = null;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      (data !== null &&
        typeof (data.msg ?? data.error_description ?? data.error) ===
          "string" &&
        (data.msg ?? data.error_description ?? data.error)) ||
      `Auth failed (${res.status})`;
    throw new Error(String(message));
  }
  return data;
}

function toSession(data: {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  user?: { id?: unknown };
}): SupaSession {
  if (
    typeof data.access_token !== "string" ||
    typeof data.refresh_token !== "string" ||
    typeof data.expires_in !== "number" ||
    typeof data.user?.id !== "string"
  ) {
    throw new Error("Malformed auth session");
  }
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at_ms: Date.now() + data.expires_in * 1_000,
    user_id: data.user.id,
  };
}

function parseSession(raw: string | null): SupaSession | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as Partial<SupaSession>;
    if (
      typeof value.access_token !== "string" ||
      typeof value.refresh_token !== "string" ||
      typeof value.expires_at_ms !== "number" ||
      typeof value.user_id !== "string"
    ) {
      return null;
    }
    return value as SupaSession;
  } catch {
    return null;
  }
}

// Bumped by clearSession so an in-flight refresh cannot write a session
// back after an explicit sign-out.
let sessionEpoch = 0;
// One identity bootstrap at a time. Supabase refresh tokens are
// single-use, so concurrent refreshes (Home, key list and realtime all
// call this on launch) race: the loser is rejected, and it used to fall
// through to a brand-new anonymous signup — silently moving the user to
// an identity that owns none of their keys.
let sessionInFlight: Promise<SupaSession> | null = null;

async function loadOrCreateSession(epoch: number): Promise<SupaSession> {
  const stored = parseSession(await storeGet(SESSION_KEY));

  if (stored !== null) {
    const stale =
      stored.force_refresh === true ||
      stored.expires_at_ms - Date.now() <= REFRESH_MARGIN_MS;
    // Still comfortably valid and not flagged: reuse it as-is.
    if (!stale) return stored;

    // Rotate the token, but never replace the identity: if rotation
    // fails while the current access token still works, keep using it
    // and retry on the next call.
    try {
      const data = (await supaFetch("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: stored.refresh_token },
      })) as Parameters<typeof toSession>[0];
      const session = toSession(data);
      if (epoch === sessionEpoch) {
        await storeSet(SESSION_KEY, JSON.stringify(session));
      }
      return session;
    } catch (error) {
      if (stored.expires_at_ms > Date.now()) return stored;
      const detail =
        error instanceof Error ? error.message : String(error);
      throw new SessionExpiredError(
        `This device's session expired and could not be renewed (${detail}). Sign out, sign back in with your passkey, then reconnect your trading key.`,
      );
    }
  }

  // No stored identity: first launch on this device, or right after an
  // explicit sign-out. Creating one is correct here — there is nothing
  // to preserve yet.
  const data = (await supaFetch("/auth/v1/signup", {
    method: "POST",
    body: {},
  })) as Parameters<typeof toSession>[0];
  const session = toSession(data);
  if (epoch === sessionEpoch) {
    await storeSet(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

/**
 * Returns a usable session, refreshing or (on first launch) creating
 * the anonymous identity. Concurrent callers share one refresh.
 * Throws when the backend is not configured, unreachable, or when the
 * stored session expired — never by swapping in a new identity.
 */
async function ensureSession(): Promise<SupaSession> {
  if (!isBackendConfigured()) {
    throw new Error("Backend is not configured");
  }
  if (sessionInFlight !== null) return sessionInFlight;
  const pending = loadOrCreateSession(sessionEpoch);
  sessionInFlight = pending;
  try {
    return await pending;
  } finally {
    if (sessionInFlight === pending) sessionInFlight = null;
  }
}

/**
 * Marks the current access token as stale so the next call refreshes it.
 * The refresh token — and therefore the user's identity — is kept:
 * dropping the session would strand every server-side row (trading keys,
 * copy settings, equity history) under an anonymous user the app can no
 * longer reach.
 */
async function expireAccessToken(): Promise<void> {
  const stored = parseSession(await storeGet(SESSION_KEY));
  if (stored === null) return;
  await storeSet(
    SESSION_KEY,
    JSON.stringify({ ...stored, force_refresh: true }),
  );
}

/** Best-effort server sign-out, then drops the local session. */
async function clearSession(): Promise<void> {
  // Invalidate any refresh already in flight so it cannot write the old
  // identity back after sign-out.
  sessionEpoch += 1;
  sessionInFlight = null;
  const stored = parseSession(await storeGet(SESSION_KEY));
  if (stored && isBackendConfigured()) {
    try {
      await supaFetch("/auth/v1/logout", {
        method: "POST",
        token: stored.access_token,
      });
    } catch {
      // Local clearing is what matters.
    }
  }
  await storeDelete(SESSION_KEY);
}

export {
  clearSession,
  ensureSession,
  expireAccessToken,
  getSupabaseConfig,
  isBackendConfigured,
};
export type { SupaSession };
