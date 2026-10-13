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
};

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

/**
 * Returns a usable session, refreshing or anonymously signing in as
 * needed. Throws when the backend is not configured or unreachable.
 */
async function ensureSession(): Promise<SupaSession> {
  if (!isBackendConfigured()) {
    throw new Error("Backend is not configured");
  }
  const stored = parseSession(await storeGet(SESSION_KEY));
  if (stored && stored.expires_at_ms - Date.now() > REFRESH_MARGIN_MS) {
    return stored;
  }
  if (stored?.refresh_token) {
    try {
      const data = (await supaFetch("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: stored.refresh_token },
      })) as Parameters<typeof toSession>[0];
      const session = toSession(data);
      await storeSet(SESSION_KEY, JSON.stringify(session));
      return session;
    } catch {
      // Fall through to a fresh anonymous sign-in.
    }
  }
  const data = (await supaFetch("/auth/v1/signup", {
    method: "POST",
    body: {},
  })) as Parameters<typeof toSession>[0];
  const session = toSession(data);
  await storeSet(SESSION_KEY, JSON.stringify(session));
  return session;
}

/** Best-effort server sign-out, then drops the local session. */
async function clearSession(): Promise<void> {
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

export { clearSession, ensureSession, getSupabaseConfig, isBackendConfigured };
export type { SupaSession };
