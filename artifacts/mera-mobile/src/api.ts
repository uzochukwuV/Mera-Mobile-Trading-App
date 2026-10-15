import Constants from "expo-constants";
import type { MarketRow } from "./screens/types";
import {
  clearSession,
  ensureSession,
  isBackendConfigured,
} from "./session";

// Public (unauthenticated) Perpl Arena endpoints. Authenticated routes
// (dashboard, trading, copy, …) arrive with Phase 1 (Supabase anon JWT).

const DEFAULT_API_URL =
  "https://01a13ff4-99a1-7e33-97a5-4327175bff36-8080.eur-1.aiven.app";

const apiBaseUrl: string =
  (Constants.expoConfig?.extra?.perplApiUrl as string | undefined) ??
  DEFAULT_API_URL;

const REQUEST_TIMEOUT_MS = 15_000;
const MARKETS_CACHE_TTL_MS = 15_000;

class ApiError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

type ApiMarket = {
  market_id: number;
  symbol: string;
  price_decimals: number;
  size_decimals: number;
  initial_margin: number;
  order_ttl_blocks: number;
  oracle_price: string | null;
  mark_price: string | null;
  last_price: string | null;
  mid_price: string | null;
  bid: string | null;
  ask: string | null;
  price_24h_ago: string | null;
  daily_volume: string | null;
  open_interest: string | null;
  price_at: string | null;
};

type ApiCandle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
};

async function fetchJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl}${path}`, {
      headers: {
        Accept: "application/json",
        // ngrok free tier serves a browser interstitial without this.
        "ngrok-skip-browser-warning": "true",
      },
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : "network",
      error instanceof Error ? error.message : "Network request failed",
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let code = `http_${res.status}`;
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new ApiError(code, message, res.status);
  }
  return (await res.json()) as T;
}

async function getMarkets(): Promise<ApiMarket[]> {
  const body = await fetchJson<{ markets: ApiMarket[] }>("/markets");
  return body.markets ?? [];
}

let marketsCache: { at: number; data: ApiMarket[] } | null = null;

/** Markets list with a short TTL so Markets → Pair navigation reuses it. */
async function getMarketsCached(): Promise<ApiMarket[]> {
  if (marketsCache && Date.now() - marketsCache.at < MARKETS_CACHE_TTL_MS) {
    return marketsCache.data;
  }
  const data = await getMarkets();
  marketsCache = { at: Date.now(), data };
  return data;
}

async function getCandles(
  marketId: number,
  resolution = 3600,
  hours = 24,
): Promise<ApiCandle[]> {
  const body = await fetchJson<{
    marketId: number;
    resolution: number;
    candles: ApiCandle[];
  }>(`/markets/${marketId}/candles?resolution=${resolution}&hours=${hours}`);
  return body.candles ?? [];
}

// --- Human-unit mapping (Perpl sends scaled integers) ---

const COLLATERAL_DECIMALS = 6;

function formatPrice(human: number, priceDecimals: number): string {
  const digits = Math.min(Math.max(priceDecimals, 2), 5);
  return human.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatUsdCompact(raw: string | null): string {
  if (raw === null) return "—";
  const usd = Number(raw) / 10 ** COLLATERAL_DECIMALS;
  if (!Number.isFinite(usd)) return "—";
  const abs = Math.abs(usd);
  const trim = (n: number): string =>
    String(Math.round(n * 10) / 10).replace(/\.0$/, "");
  if (abs >= 1_000_000_000) return `$${trim(usd / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `$${trim(usd / 1_000_000)}M`;
  if (abs >= 1_000) return `$${trim(usd / 1_000)}K`;
  return `$${usd.toFixed(2)}`;
}

function marketChangePct(market: ApiMarket): number {
  const mark = Number(market.mark_price);
  const ago = Number(market.price_24h_ago);
  if (!Number.isFinite(mark) || !Number.isFinite(ago) || ago === 0) return 0;
  return ((mark - ago) / ago) * 100;
}

function toMarketRow(market: ApiMarket): MarketRow {
  const markHuman = Number(market.mark_price) / 10 ** market.price_decimals;
  return {
    id: market.market_id,
    symbol: market.symbol,
    mark: Number.isFinite(markHuman)
      ? formatPrice(markHuman, market.price_decimals)
      : "—",
    changePct: marketChangePct(market),
    volume: formatUsdCompact(market.daily_volume),
  };
}

// --- Authenticated endpoints (Supabase anon JWT, appflow S2) ---

async function authedFetch<T>(
  path: string,
  init?: { method?: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown },
): Promise<T> {
  if (!isBackendConfigured()) {
    throw new ApiError("backend_unconfigured", "Backend is not configured");
  }
  const session = await ensureSession().catch((caught: unknown) => {
    throw new ApiError(
      "auth_unavailable",
      caught instanceof Error ? caught.message : "Sign-in failed",
    );
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error && error.name === "AbortError"
        ? "timeout"
        : "network",
      error instanceof Error ? error.message : "Network request failed",
    );
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401) {
    // Do not auto re-signup here: a fresh anonymous identity would
    // orphan the wallet binding. Surface it; refresh keeps identity.
    await clearSession();
    throw new ApiError("unauthorized", "Session expired — pull to refresh");
  }
  if (!res.ok) {
    let code = `http_${res.status}`;
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as {
        error?: { code?: string; message?: string };
      };
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new ApiError(code, message, res.status);
  }
  return (await res.json()) as T;
}

type ApiPosition = {
  market_id: number;
  symbol: string | null;
  side: string | number;
  size_scaled: string;
  entry_price_scaled: string;
  leverage_hundredths: number;
  leader_id: string | null;
  leader_handle: string | null;
  last_price: string | null;
  mark_price: string | null;
};

type ApiCopySetting = {
  leader_id: string;
  leader_handle: string | null;
  allocation_usd: number | string;
  paused_reason: string | null;
};

type ApiNotification = {
  id: number;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type DashboardData = {
  equity: string | null;
  equityAt: string | null;
  balance: number | null;
  locked: number | null;
  walletAt: string | null;
  positions: ApiPosition[];
  activeCopySettings: ApiCopySetting[];
  realizedPnlToday: number;
  unreadNotifications: ApiNotification[];
};

async function getDashboard(): Promise<DashboardData> {
  const body = await authedFetch<{
    equity?: string | number | null;
    equityAt?: string | null;
    balance?: number | string | null;
    locked?: number | string | null;
    walletAt?: string | null;
    positions?: ApiPosition[];
    activeCopySettings?: ApiCopySetting[];
    realizedPnlToday?: number;
    unreadNotifications?: ApiNotification[];
  }>("/dashboard");
  return {
    equity:
      body.equity === null || body.equity === undefined
        ? null
        : String(body.equity),
    equityAt: body.equityAt ?? null,
    // sum() aggregates arrive as numeric strings; accept both.
    balance: toFiniteNumber(body.balance),
    locked: toFiniteNumber(body.locked),
    walletAt: body.walletAt ?? null,
    positions: body.positions ?? [],
    activeCopySettings: body.activeCopySettings ?? [],
    realizedPnlToday: body.realizedPnlToday ?? 0,
    unreadNotifications: body.unreadNotifications ?? [],
  };
}

// --- Account-creation metadata (public; drives the Fund screen) ---

type AccountCreationMeta = {
  chainId: number;
  network: string;
  exchangeAddress: string;
  collateralToken: {
    id: number;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  minAccountOpenAmount: { raw: string; amount: number };
  minDepositAmount: { raw: string; amount: number };
};

let metaCache: { at: number; data: AccountCreationMeta } | null = null;
const META_CACHE_TTL_MS = 5 * 60_000;

async function getAccountCreation(): Promise<AccountCreationMeta> {
  if (metaCache && Date.now() - metaCache.at < META_CACHE_TTL_MS) {
    return metaCache.data;
  }
  const data = await fetchJson<AccountCreationMeta>("/meta/account-creation");
  metaCache = { at: Date.now(), data };
  return data;
}

// --- Own profile (handle read/update) ---

type MeUser = {
  id: string;
  handle: string | null;
  wallet_address: string | null;
  created_at?: string;
};

async function getMe(): Promise<MeUser> {
  const body = await authedFetch<{ user: MeUser }>("/users/me");
  return body.user;
}

async function updateHandle(handle: string): Promise<MeUser> {
  const body = await authedFetch<{ user: MeUser }>("/users/me", {
    method: "PUT",
    body: { handle },
  });
  return body.user;
}

// --- Wallet link (appflow S2b): challenge → EIP-191 sign → bind ---

/** Exact message the wallet must sign (mirrors the backend). */
function linkMessageText(args: {
  userId: string;
  address: string;
  nonce: string;
  expiry: number;
}): string {
  return (
    `Perpl Arena wallet link\n` +
    `user: ${args.userId}\n` +
    `address: ${args.address}\n` +
    `nonce: ${args.nonce}\n` +
    `expiry: ${args.expiry}`
  );
}

/** Ensures the caller's users row exists. Fresh anonymous identities have
 * none, and /users/link-challenge FK-requires one. Creates a provisional
 * handle on first use; the user can rename it in Account. */
async function ensureProfileRow(): Promise<void> {
  try {
    await getMe();
    return;
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      (error.status !== 404 && error.code !== "not_found")
    ) {
      throw error;
    }
  }
  const { getRandomBytes } = await import("expo-crypto");
  const { bytesToHex } = await import("viem");
  for (let attempt = 0; attempt < 3; attempt++) {
    const suffix = bytesToHex(getRandomBytes(3)).slice(2, 8);
    try {
      await authedFetch("/users/me", {
        method: "PUT",
        body: { handle: `trader_${suffix}` },
      });
      return;
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === "conflict" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }
}

async function linkWallet(
  address: string,
  signMessage: (message: string) => Promise<string>,
): Promise<void> {
  const session = await ensureSession();
  // /users/link-challenge FK-requires a users row, which fresh anonymous
  // identities don't have yet. Ensure it (provisional handle, user can
  // rename in Account) before requesting the challenge.
  await ensureProfileRow();
  const challenge = await authedFetch<{ nonce: string; expiry: number }>(
    "/users/link-challenge",
  );
  const lower = address.toLowerCase();
  const message = linkMessageText({
    userId: session.user_id,
    address: lower,
    nonce: challenge.nonce,
    expiry: challenge.expiry,
  });
  const signature = await signMessage(message);
  await authedFetch("/users/link-wallet", {
    method: "POST",
    body: {
      address: lower,
      nonce: challenge.nonce,
      expiry: challenge.expiry,
      signature,
    },
  });
}

// --- Perpl Connect (appflow S3): enroll / import / key list ---

type PerplAccount = {
  id: string;
  address: string;
  scope_mask: number;
  label: string | null;
  status: string;
  connected_at: string | null;
};

async function getAccounts(): Promise<PerplAccount[]> {
  const body = await authedFetch<{ accounts?: PerplAccount[] }>("/accounts");
  return body.accounts ?? [];
}

/** Fresh Ed25519 keypair for enrollment. Private key stays in memory only. */
async function generateEdKeypair(): Promise<{
  privateKeyHex: string;
  publicKeyHex: string;
}> {
  const { getRandomBytes } = await import("expo-crypto");
  const { createEd25519SigningSession } = await import("@category-labs/mera");
  const { bytesToHex } = await import("viem");
  const privateKey = getRandomBytes(32);
  const session = createEd25519SigningSession({ privateKey });
  try {
    return {
      privateKeyHex: bytesToHex(privateKey),
      publicKeyHex: bytesToHex(session.publicKey),
    };
  } finally {
    session.end();
    privateKey.fill(0);
  }
}

type EnrollPayload = {
  typedData: {
    domain: Record<string, unknown>;
    types: Record<string, Array<{ name: string; type: string }>>;
    message: Record<string, unknown>;
    primaryType?: string;
  };
  mac: string;
};

async function requestEnrollPayload(args: {
  address: string;
  publicKey: string;
  scopeMask: 1 | 2 | 3;
  label: string;
}): Promise<EnrollPayload> {
  return authedFetch<EnrollPayload>("/accounts/enroll/payload", {
    method: "POST",
    body: {
      address: args.address,
      publicKey: args.publicKey,
      scopeMask: args.scopeMask,
      label: args.label,
    },
  });
}

function stripDomain(
  types: Record<string, Array<{ name: string; type: string }>>,
): Record<string, Array<{ name: string; type: string }>> {
  const { EIP712Domain: _ignored, ...rest } = types;
  return rest;
}

/** Wallet EIP-712 enrollment signature via the mera session. */
async function signEnrollTypedData(
  session: import("@category-labs/mera").Secp256k1SigningSession,
  typedData: EnrollPayload["typedData"],
): Promise<string> {
  const { toViemAccount } = await import("@category-labs/mera/viem");
  const { EIP712Domain: _ignored, ...types } = typedData.types;
  const primaryType =
    typedData.primaryType ?? Object.keys(types)[0] ?? "Payload";
  const account = toViemAccount(session);
  const sign = account.signTypedData as unknown as (args: {
    domain: unknown;
    types: unknown;
    primaryType: string;
    message: unknown;
  }) => Promise<string>;
  return sign({
    domain: typedData.domain,
    types,
    primaryType,
    message: typedData.message,
  });
}

/** Ed25519 proof-of-possession over the EIP-712 digest. */
async function signPopDigest(
  privateKeyHex: string,
  typedData: EnrollPayload["typedData"],
): Promise<string> {
  const { createEd25519SigningSession } = await import("@category-labs/mera");
  const { bytesToHex, hashTypedData, hexToBytes } = await import("viem");
  const types = stripDomain(typedData.types);
  const primaryType =
    typedData.primaryType ?? Object.keys(types)[0] ?? "Payload";
  const hash = hashTypedData as unknown as (args: {
    domain: unknown;
    types: unknown;
    primaryType: string;
    message: unknown;
  }) => `0x${string}`;
  const digest = hash({
    domain: typedData.domain,
    types,
    primaryType,
    message: typedData.message,
  });
  const session = createEd25519SigningSession({
    privateKey: hexToBytes(privateKeyHex as `0x${string}`),
  });
  try {
    const sig = await session.signMessage(hexToBytes(digest));
    return bytesToHex(sig);
  } finally {
    session.end();
  }
}

async function enrollKey(args: {
  address: string;
  typedData: unknown;
  mac: string;
  signature: string;
  popSignature: string;
  privateKey: string;
  label: string;
}): Promise<PerplAccount> {
  const body = await authedFetch<{ account: PerplAccount }>("/accounts/enroll", {
    method: "POST",
    body: args,
  });
  return body.account;
}

async function importKey(args: {
  address: string;
  apiKey: string;
  privateKey: string;
  scopeMask: 1 | 2 | 3;
  label: string;
}): Promise<PerplAccount> {
  const body = await authedFetch<{ account: PerplAccount }>("/accounts/import", {
    method: "POST",
    body: args,
  });
  return body.account;
}

// --- Manual trading intents (appflow S8) ---

type OrderIntent = {
  marketId: number;
  side: "long" | "short" | "close";
  size?: number;
  price?: number;
  leverage?: number;
  dryRun?: boolean;
};

async function submitOrder(input: OrderIntent): Promise<{ duplicate: boolean }> {
  const { randomUUID } = await import("expo-crypto");
  const body = await authedFetch<{ intent?: unknown; duplicate?: boolean }>(
    "/trading/orders",
    {
      method: "POST",
      body: {
        marketId: input.marketId,
        side: input.side,
        size: input.size,
        price: input.price,
        leverage: input.leverage ?? 1,
        idempotencyKey: randomUUID(),
        dryRun: input.dryRun ?? false,
      },
    },
  );
  return { duplicate: body.duplicate ?? false };
}

async function markNotificationsRead(): Promise<void> {
  await authedFetch("/dashboard/notifications/read", {
    method: "POST",
    body: {},
  });
}

// --- Tournaments (appflow S13) ---

type ApiTournament = {
  id: string;
  name: string;
  status: string;
  entrants?: string | number;
  entries?: string | number;
  prize?: string;
  rank?: string | null;
};

async function getTournaments(): Promise<ApiTournament[]> {
  const body = await authedFetch<{ tournaments?: ApiTournament[] }>(
    "/tournaments",
  );
  return body.tournaments ?? [];
}

async function getMyTournamentEntries(): Promise<{ tournament_id: string }[]> {
  const body = await authedFetch<{ entries?: { tournament_id: string }[] }>(
    "/tournaments/me/entries",
  );
  return body.entries ?? [];
}

async function joinTournament(id: string): Promise<void> {
  await authedFetch(`/tournaments/${encodeURIComponent(id)}/join`, {
    method: "POST",
    body: {},
  });
}

// --- Key revocation + own trader profile (S14) ---

async function revokeAccount(id: string): Promise<void> {
  await authedFetch(`/accounts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

async function putLeaderProfile(input: {
  isPublic: boolean;
  styles?: string[];
  bio?: string;
}): Promise<void> {
  await authedFetch("/leaders/me", {
    method: "PUT",
    body: {
      isPublic: input.isPublic,
      styles: input.styles ?? [],
      bio: input.bio ?? "",
    },
  });
}

// --- One-click trading flag (Perpl on-chain, wallet-signed) ---

const FALLBACK_EXCHANGE_ADDRESS =
  "0x1964c32f0be608e7d29302aff5e61268e72080cc";

const EXCHANGE_ABI = [
  {
    name: "allowOrderForwarding",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "allow", type: "bool" }],
    outputs: [],
  },
] as const;

/** Enables/disables API order forwarding from the account wallet. */
async function setOrderForwarding(
  session: import("@category-labs/mera").Secp256k1SigningSession,
  allow: boolean,
): Promise<string> {
  const { toViemAccount } = await import("@category-labs/mera/viem");
  const { createWalletClient, http } = await import("viem");
  let exchange = FALLBACK_EXCHANGE_ADDRESS;
  try {
    const meta = await getAccountCreation();
    if (/^0x[0-9a-fA-F]{40}$/.test(meta.exchangeAddress)) {
      exchange = meta.exchangeAddress;
    }
  } catch {
    // Fall back to the documented testnet exchange.
  }
  const account = toViemAccount(session) as unknown as import("viem").LocalAccount;
  const walletClient = createWalletClient({
    account,
    chain: {
      id: 10143,
      name: "Monad Testnet",
      nativeCurrency: { decimals: 18, name: "MON", symbol: "MON" },
      rpcUrls: { default: { http: [MONAD_TESTNET_RPC] } },
    },
    transport: http(MONAD_TESTNET_RPC, { timeout: REQUEST_TIMEOUT_MS }),
  });
  return walletClient.writeContract({
    address: exchange as `0x${string}`,
    abi: EXCHANGE_ABI,
    functionName: "allowOrderForwarding",
    args: [allow],
    account,
    chain: walletClient.chain,
  });
}

// --- Copy + manual order reads (appflow S9) and kill switch (S5/S12) ---

type ApiOrder = {
  id: number;
  market_id: number;
  order_type: number;
  side?: string;
  size_scaled: string | number;
  price_scaled: string | number;
  filled_size_scaled?: string | number;
  status: string;
  dry_run?: boolean;
  created_at: string;
};

async function getCopyOrders(): Promise<ApiOrder[]> {
  const body = await authedFetch<{ orders?: ApiOrder[] }>(
    "/copy/orders?limit=50",
  );
  return body.orders ?? [];
}

async function getManualOrders(): Promise<ApiOrder[]> {
  const body = await authedFetch<{ orders?: ApiOrder[] }>(
    "/trading/manual?limit=50",
  );
  return body.orders ?? [];
}

async function killSwitch(): Promise<{ affectedSettings: number }> {
  const body = await authedFetch<{
    killSwitchRequested?: boolean;
    affectedSettings?: number;
  }>("/copy/kill-switch", { method: "POST", body: {} });
  return { affectedSettings: body.affectedSettings ?? 0 };
}

function orderSide(orderType: number): "Long" | "Short" | null {
  if (orderType === 1 || orderType === 3) return "Long";
  if (orderType === 2 || orderType === 4) return "Short";
  return null; // 5 = cancel intent: no side of its own
}

/**
 * Position side from either backend encoding: numeric 1 (long) / 2
 * (short) as served by /dashboard and /leaders/:id, or "long"/"short"
 * strings. Unknown values default to short so PnL math stays explicit.
 */
function isLongSide(side: unknown): boolean {
  if (typeof side === "number") return side === 1;
  const text = String(side).toLowerCase();
  return text === "long" || text === "1";
}

function orderStatus(status: string): "Filled" | "Open" | "Partial" | "Cancelled" {
  const lower = String(status).toLowerCase();
  if (lower === "filled") return "Filled";
  if (lower === "partial") return "Partial";
  if (lower === "open" || lower === "submitted") return "Open";
  return "Cancelled";
}

function orderTimeLabel(createdAt: string): string {
  const at = Date.parse(createdAt);
  if (!Number.isFinite(at)) return "";
  const date = new Date(at);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (at >= startOfToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (at >= startOfToday - 86_400_000) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Live fills feed: worker copy orders + manual intents, newest first. */
async function getTrades(): Promise<{
  fills: import("./screens/types").TradeFillRow[];
  error: string | null;
}> {
  let copy: ApiOrder[] = [];
  let manual: ApiOrder[] = [];
  let markets: ApiMarket[] = [];
  try {
    const [copyRows, manualRows, marketRows] = await Promise.all([
      getCopyOrders(),
      getManualOrders(),
      getMarketsCached(),
    ]);
    copy = copyRows;
    manual = manualRows;
    markets = marketRows;
  } catch (caught) {
    return {
      fills: [],
      error: caught instanceof ApiError ? caught.message : "Couldn't load trades",
    };
  }
  const meta = new Map(
    markets.map((m) => [
      m.market_id,
      { symbol: m.symbol, price: m.price_decimals, size: m.size_decimals },
    ]),
  );
  const toRow = (
    order: ApiOrder,
    source: "Copy" | "Manual",
    prefix: string,
  ): import("./screens/types").TradeFillRow | null => {
    const side = orderSide(order.order_type);
    if (side === null) return null;
    const info = meta.get(order.market_id) ?? {
      symbol: `Market ${order.market_id}`,
      price: 2,
      size: 0,
    };
    const filled = Number(order.filled_size_scaled ?? 0) / 10 ** info.size;
    const size = Number(order.size_scaled) / 10 ** info.size;
    const shown = Number.isFinite(filled) && filled > 0 ? filled : size;
    const priceRaw = Number(order.price_scaled) / 10 ** info.price;
    const digits = 5;
    return {
      id: `${prefix}-${order.id}`,
      market: info.symbol,
      side,
      size: Number.isFinite(shown)
        ? shown.toLocaleString("en-US", { maximumFractionDigits: 6 })
        : "—",
      price:
        Number.isFinite(priceRaw) && priceRaw > 0
          ? priceRaw.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: digits,
            })
          : "Market",
      time: orderTimeLabel(order.created_at),
      status: orderStatus(order.status),
      source,
    };
  };
  const fills = [
    ...copy.map((o) => toRow(o, "Copy", "copy")),
    ...manual.map((o) => toRow(o, "Manual", "manual")),
  ].filter((row) => row !== null);
  fills.sort((a, b) => {
    const ai = Number(a.id.split("-").pop());
    const bi = Number(b.id.split("-").pop());
    return bi - ai;
  });
  return { fills, error: null };
}

// --- Leaders + copy (appflow S10/S11/S12) ---

type ApiLeader = {
  user_id: string;
  handle: string;
  is_public?: boolean;
  styles?: string[];
  bio?: string | null;
  total_pnl_usd?: number | string | null;
  pnl_24h_usd?: number | string | null;
  win_rate?: number | null;
  max_drawdown?: number | null;
  sharpe?: number | null;
  followers_count?: number | null;
};

type LeaderSort = "pnl" | "pnl24h" | "winRate" | "sharpe" | "followers";

async function getLeaders(sort: LeaderSort = "pnl"): Promise<ApiLeader[]> {
  const body = await authedFetch<{ leaders?: ApiLeader[] }>(
    `/leaders?sort=${sort}&limit=25`,
  );
  return body.leaders ?? [];
}

async function getFollows(): Promise<
  { leader_id?: string; user_id?: string }[]
> {
  const body = await authedFetch<{ follows?: unknown[] }>("/leaders/follows");
  const follows = (body.follows ?? []) as Record<string, unknown>[];
  // The backend carries the leader id in user_id (no leader_id column).
  return follows.map((f) => {
    const userId = typeof f.user_id === "string" ? f.user_id : undefined;
    return {
      leader_id:
        typeof f.leader_id === "string" ? f.leader_id : userId,
      user_id: userId,
    };
  });
}

type ApiLeaderDetail = {
  profile: ApiLeader;
  positions: {
    market_id: number;
    symbol: string | null;
    side: string | number;
    size_scaled: string | number;
    entry_price_scaled: string | number;
    leverage_hundredths: number;
    updated_at: string;
    last_price: string | number | null;
  }[];
  recentFills: {
    market_id: number;
    order_type: number;
    price_scaled: string | number;
    size_scaled: string | number;
    fee?: string | number;
    at: string;
  }[];
};

async function getLeader(id: string): Promise<ApiLeaderDetail> {
  return authedFetch<ApiLeaderDetail>(
    `/leaders/${encodeURIComponent(id)}`,
  );
}

async function followLeader(id: string): Promise<void> {
  await authedFetch(`/leaders/${encodeURIComponent(id)}/follow`, {
    method: "POST",
    body: {},
  });
}

async function unfollowLeader(id: string): Promise<void> {
  await authedFetch(`/leaders/${encodeURIComponent(id)}/follow`, {
    method: "DELETE",
  });
}

type CopySettingsInput = {
  allocationUsd: number;
  maxLeverage?: number;
  maxNotionalPerTradeUsd?: number;
  dailyLossLimitUsd?: number;
  weeklyDrawdownLimitBps?: number;
  marketAllowlist?: number[];
  marketBlacklist?: number[];
  slippageBps?: number;
  copyDelayMs?: number;
  reduceOnly?: boolean;
  stopLossBps?: number;
  enabled?: boolean;
};

async function putCopySettings(
  leaderId: string,
  input: CopySettingsInput,
): Promise<void> {
  await authedFetch(`/copy/${encodeURIComponent(leaderId)}`, {
    method: "PUT",
    body: {
      allocationUsd: input.allocationUsd,
      maxLeverage: input.maxLeverage ?? 3,
      maxNotionalPerTradeUsd: input.maxNotionalPerTradeUsd ?? 5000,
      dailyLossLimitUsd: input.dailyLossLimitUsd ?? 50,
      weeklyDrawdownLimitBps: input.weeklyDrawdownLimitBps ?? 1000,
      marketAllowlist: input.marketAllowlist ?? [],
      marketBlacklist: input.marketBlacklist ?? [],
      slippageBps: input.slippageBps ?? 50,
      copyDelayMs: input.copyDelayMs ?? 1500,
      reduceOnly: input.reduceOnly ?? false,
      stopLossBps: input.stopLossBps ?? 2000,
      enabled: input.enabled ?? true,
    },
  });
}

type ApiCopySettingFull = {
  leader_id: string;
  leader_handle?: string | null;
  handle?: string | null;
  allocation_usd: number;
  enabled?: boolean;
  paused_reason?: string | null;
  max_leverage?: number;
  max_notional_per_trade_usd?: number;
  daily_loss_limit_usd?: number;
  weekly_drawdown_limit_bps?: number;
  market_allowlist?: number[];
  market_blacklist?: number[];
  slippage_bps?: number;
  copy_delay_ms?: number;
  reduce_only?: boolean;
  stop_loss_bps?: number;
};

async function getCopySettings(): Promise<ApiCopySettingFull[]> {
  const body = await authedFetch<{
    settings?: ApiCopySettingFull[];
    copies?: ApiCopySettingFull[];
  }>("/copy");
  // numeric columns arrive as strings from pg — coerce once at parse so
  // readers (incl. setCopyEnabled rewrites) always see numbers.
  return (body.settings ?? body.copies ?? []).map((s) => ({
    ...s,
    allocation_usd: toFiniteNumber(s.allocation_usd) ?? 0,
    max_leverage: toFiniteNumber(s.max_leverage) ?? 3,
    max_notional_per_trade_usd:
      toFiniteNumber(s.max_notional_per_trade_usd) ?? 5000,
    daily_loss_limit_usd: toFiniteNumber(s.daily_loss_limit_usd) ?? 50,
    weekly_drawdown_limit_bps:
      toFiniteNumber(s.weekly_drawdown_limit_bps) ?? 1000,
    slippage_bps: toFiniteNumber(s.slippage_bps) ?? 50,
    copy_delay_ms: toFiniteNumber(s.copy_delay_ms) ?? 1500,
    stop_loss_bps: toFiniteNumber(s.stop_loss_bps) ?? 2000,
  }));
}

/** Pause/resume by rewriting the stored settings with flipped enabled. */
async function setCopyEnabled(
  leaderId: string,
  enabled: boolean,
): Promise<void> {
  const settings = await getCopySettings();
  const current = settings.find((s) => s.leader_id === leaderId);
  if (!current) throw new ApiError("not_found", "Copy setting not found");
  await putCopySettings(leaderId, {
    allocationUsd: Number(current.allocation_usd),
    maxLeverage: current.max_leverage ?? 3,
    maxNotionalPerTradeUsd: current.max_notional_per_trade_usd ?? 5000,
    dailyLossLimitUsd: current.daily_loss_limit_usd ?? 50,
    weeklyDrawdownLimitBps: current.weekly_drawdown_limit_bps ?? 1000,
    marketAllowlist: current.market_allowlist ?? [],
    marketBlacklist: current.market_blacklist ?? [],
    slippageBps: current.slippage_bps ?? 50,
    copyDelayMs: current.copy_delay_ms ?? 1500,
    reduceOnly: current.reduce_only ?? false,
    stopLossBps: current.stop_loss_bps ?? 2000,
    enabled,
  });
}

async function deleteCopy(leaderId: string): Promise<void> {
  await authedFetch(`/copy/${encodeURIComponent(leaderId)}`, {
    method: "DELETE",
  });
}

// --- On-chain aUSD balance (Monad testnet, no auth needed) ---

const AUSD_ADDRESS = "0xa9012a055bd4e0eDfF8Ce09f960291C09D5322dC";
const AUSD_DECIMALS = 6;
const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz";

const BALANCE_OF_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

function formatMoney(human: number): string {
  if (!Number.isFinite(human)) return "—";
  return human.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Numeric columns (incl. sum() aggregates) arrive as strings from pg. */
function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num) ? num : null;
}

function formatSigned(human: number): string {
  if (!Number.isFinite(human)) return "—";
  const abs = Math.abs(human).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${human < 0 ? "-" : "+"}${abs}`;
}

/** Raw collateral balanceOf for an address; throws when unreachable. */
async function getAusdBalance(address: string): Promise<{
  raw: bigint;
  human: number;
  label: string;
}> {
  let tokenAddress = AUSD_ADDRESS;
  let decimals = AUSD_DECIMALS;
  try {
    const meta = await getAccountCreation();
    if (/^0x[0-9a-fA-F]{40}$/.test(meta.collateralToken.address)) {
      tokenAddress = meta.collateralToken.address;
    }
    if (
      Number.isInteger(meta.collateralToken.decimals) &&
      meta.collateralToken.decimals >= 0 &&
      meta.collateralToken.decimals <= 18
    ) {
      decimals = meta.collateralToken.decimals;
    }
  } catch {
    // Fall back to the baked-in testnet values.
  }
  const { createPublicClient, http } = await import("viem");
  const client = createPublicClient({
    chain: {
      id: 10143,
      name: "Monad Testnet",
      nativeCurrency: { decimals: 18, name: "MON", symbol: "MON" },
      rpcUrls: { default: { http: [MONAD_TESTNET_RPC] } },
    },
    transport: http(MONAD_TESTNET_RPC, { timeout: REQUEST_TIMEOUT_MS }),
  });
  const raw = (await client.readContract({
    address: tokenAddress as `0x${string}`,
    abi: BALANCE_OF_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  })) as bigint;
  const human = Number(raw) / 10 ** decimals;
  return { raw, human, label: formatMoney(human) };
}

// --- Dashboard → screen props ---

function prettyKind(kind: string): string {
  return kind
    .split("_")
    .map((part) =>
      part.length === 0 ? part : part[0].toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function notificationDetail(n: ApiNotification): string {
  const payload = n.payload ?? {};
  for (const key of ["message", "summary", "text", "detail"]) {
    const value = payload[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return new Date(n.created_at).toLocaleString();
}

function notificationTone(kind: string): {
  status: "Filled" | "Failed" | "Submitted";
  tone: "ok" | "error" | "neutral";
} {
  const lower = kind.toLowerCase();
  if (lower.includes("fill")) return { status: "Filled", tone: "ok" };
  if (lower.includes("risk") || lower.includes("limit") || lower.includes("fail")) {
    return { status: "Failed", tone: "error" };
  }
  return { status: "Submitted", tone: "neutral" };
}

type LiveDashboard = {
  equity: string;
  available: string;
  locked: string;
  realizedPnlToday: string;
  realizedPnlUp: boolean;
  unread: number;
  lastUpdatedSecondsAgo: number;
  positions: import("./screens/types").PositionRow[];
  copies: import("./screens/types").CopyRow[];
  activity: import("./screens/types").ActivityRow[];
};

/** One round trip for everything Home renders. Never throws. */
async function loadLiveDashboard(address?: string): Promise<{
  data: LiveDashboard;
  error: string | null;
}> {
  let dashboard: DashboardData | null = null;
  let dashboardError: string | null = null;
  let markets: ApiMarket[] = [];
  try {
    const [data, marketRows] = await Promise.all([
      getDashboard(),
      getMarketsCached(),
    ]);
    dashboard = data;
    markets = marketRows;
  } catch (caught) {
    dashboardError =
      caught instanceof ApiError ? caught.message : "Couldn't load dashboard";
    try {
      markets = await getMarketsCached();
    } catch {
      markets = [];
    }
  }
  const decimals = new Map(
    markets.map((m) => [
      m.market_id,
      { price: m.price_decimals, size: m.size_decimals },
    ]),
  );

  let ausdLabel = "0.00";
  if (address) {
    try {
      ausdLabel = (await getAusdBalance(address)).label;
    } catch {
      ausdLabel = dashboard?.equity ? formatMoney(Number(dashboard.equity)) : "0.00";
    }
  } else if (dashboard?.equity) {
    ausdLabel = formatMoney(Number(dashboard.equity));
  }

  // Worker-mirrored wallet fields win when present; otherwise fall back
  // to the on-chain read (balance) and position notional (locked).
  const workerBalance =
    dashboard?.balance === null || dashboard?.balance === undefined
      ? null
      : formatMoney(dashboard.balance);
  const workerLocked =
    dashboard?.locked === null || dashboard?.locked === undefined
      ? null
      : formatMoney(dashboard.locked);

  const positions = (dashboard?.positions ?? []).map((p) => {
    const dec = decimals.get(p.market_id) ?? { price: 2, size: 0 };
    const size = Number(p.size_scaled) / 10 ** dec.size;
    const entry = Number(p.entry_price_scaled) / 10 ** dec.price;
    const markRaw = p.mark_price ?? p.last_price;
    const mark = markRaw === null ? NaN : Number(markRaw) / 10 ** dec.price;
    const long = isLongSide(p.side);
    const pnl =
      Number.isFinite(size) && Number.isFinite(entry) && Number.isFinite(mark)
        ? (long ? 1 : -1) * (mark - entry) * size
        : NaN;
    const digits = Math.min(Math.max(dec.price, 2), 5);
    return {
      symbol: p.symbol ?? `Market ${p.market_id}`,
      side: (long ? "Long" : "Short") as "Long" | "Short",
      size: Number.isFinite(size)
        ? size.toLocaleString("en-US", { maximumFractionDigits: 6 })
        : "—",
      mark: Number.isFinite(mark)
        ? mark.toLocaleString("en-US", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
          })
        : undefined,
      pnl: Number.isFinite(pnl) ? formatSigned(pnl) : "—",
      pnlUp: Number.isFinite(pnl) ? pnl >= 0 : true,
    };
  });

  const inPositions = (dashboard?.positions ?? []).reduce((sum, p) => {
    const dec = decimals.get(p.market_id) ?? { price: 2, size: 0 };
    const size = Number(p.size_scaled) / 10 ** dec.size;
    const markRaw = p.mark_price ?? p.last_price;
    const mark = markRaw === null ? NaN : Number(markRaw) / 10 ** dec.price;
    return Number.isFinite(size) && Number.isFinite(mark)
      ? sum + Math.abs(size * mark)
      : sum;
  }, 0);

  const copies = (dashboard?.activeCopySettings ?? []).map((s) => ({
    handle: s.leader_handle ?? `trader-${s.leader_id.slice(0, 6)}`,
    allocation: Number(s.allocation_usd).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    status: (s.paused_reason ? "Paused" : "Active") as "Paused" | "Active",
  }));

  const activity = (dashboard?.unreadNotifications ?? []).map((n) => {
    const mapped = notificationTone(n.kind);
    return {
      id: String(n.id),
      title: prettyKind(n.kind),
      detail: notificationDetail(n),
      status: mapped.status,
      tone: mapped.tone,
    } as import("./screens/types").ActivityRow;
  });

  const equityNum = dashboard?.equity ? Number(dashboard.equity) : NaN;
  const realized = dashboard?.realizedPnlToday ?? 0;
  const equityAt = dashboard?.equityAt ? Date.parse(dashboard.equityAt) : NaN;

  return {
    data: {
      equity: Number.isFinite(equityNum)
        ? formatMoney(equityNum)
        : (workerBalance ?? ausdLabel),
      available: workerBalance ?? ausdLabel,
      locked: workerLocked ?? formatMoney(inPositions),
      realizedPnlToday: formatSigned(realized),
      realizedPnlUp: realized >= 0,
      unread: dashboard?.unreadNotifications.length ?? 0,
      lastUpdatedSecondsAgo: Number.isFinite(equityAt)
        ? Math.max(0, Math.round((Date.now() - equityAt) / 1000))
        : 0,
      positions,
      copies,
      activity,
    },
    error: dashboardError,
  };
}

export {
  ApiError,
  apiBaseUrl,
  deleteCopy,
  enrollKey,
  followLeader,
  formatUsdCompact,
  generateEdKeypair,
  getAccountCreation,
  getAccounts,
  getAusdBalance,
  getCandles,
  getCopyOrders,
  getCopySettings,
  getDashboard,
  getFollows,
  getLeader,
  getLeaders,
  getManualOrders,
  getMarketsCached,
  getMe,
  getMyTournamentEntries,
  getTournaments,
  getTrades,
  importKey,
  isLongSide,
  joinTournament,
  killSwitch,
  linkMessageText,
  linkWallet,
  loadLiveDashboard,
  markNotificationsRead,
  orderSide,
  orderTimeLabel,
  putCopySettings,
  putLeaderProfile,
  requestEnrollPayload,
  revokeAccount,
  setCopyEnabled,
  setOrderForwarding,
  signEnrollTypedData,
  signPopDigest,
  submitOrder,
  toMarketRow,
  unfollowLeader,
  updateHandle,
};
export type { AccountCreationMeta, ApiCandle, ApiMarket, ApiPosition, DashboardData, LiveDashboard, MeUser, PerplAccount };
