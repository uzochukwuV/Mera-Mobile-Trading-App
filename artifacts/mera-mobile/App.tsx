import {
  DEMO_CHAIN_ID,
  DEMO_RPC_URL,
  type EvmContext,
  resolveEvmContext,
} from "@category-labs/mera-demo-shared/network";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { isAddressEqual } from "viem";
import { BORDER, INK, INDIGO, MUTED, PAPER, RADIUS, SHADOW_SOFT } from "./src/screens/homeTheme";
import { type AccountState } from "./src/account";
import {
  ApiError,
  deleteCopy,
  enrollKey,
  followLeader,
  generateEdKeypair,
  getAccountCreation,
  getAccounts,
  getCopySettings,
  getExchangeFills,
  getFollows,
  getLeader,
  getLeaders,
  getMarketsCached,
  getMe,
  isLongSide,
  getMyTournamentEntries,
  getTournamentDetail,
  getTournaments,
  getTrades,
  importKey,
  joinTournament,
  killSwitch,
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
  transferAusd,
  unfollowLeader,
  updateHandle,
  type LiveDashboard,
} from "./src/api";
import type {
  CopySettingsForm,
  LeaderRow,
  StandingsEntry,
  TradeFillRow,
} from "./src/screens/types";
import {
  createAccount,
  describeError,
  signIn,
  unlockStoredWallet,
} from "./src/wallet";
import { clearSession, ensureSession } from "./src/session";
import { feed } from "./src/realtime";
import { toViemAccount } from "@category-labs/mera/viem";
import { clearStoredAccount, loadStoredAccount } from "./src/storage";
import {
  AccountScreen,
  ConnectPerplScreen,
  CopyManagementScreen,
  CopySettingsScreen,
  DashboardScreen,
  DiscoverScreen,
  ExportScreen,
  FundScreen,
  MarketsScreen,
  OnboardingScreen,
  PairDetailScreen,
  SplashScreen,
  TradeTicketScreen,
  TradesScreen,
  TraderProfileScreen,
  TournamentsScreen,
  TournamentStandingsScreen,
  WithdrawScreen,
} from "./src/screens";
import { spacing } from "./src/theme";

// Tour router (tabs per appflow §6 — Home · Markets · Traders · Contests ·
// Account — with stack pushes for detail screens). All screens render live
// backend data with guarded fallbacks while loading.
type TabKey = "dashboard" | "markets" | "discover" | "contests" | "account";
type StackKey =
  | "connect"
  | "fund"
  | "pair"
  | "ticket"
  | "trades"
  | "profile"
  | "copies"
  | "editCopy"
  | "standings"
  | "export"
  | "withdraw";
type Tour = { tab: TabKey; stack: StackKey[] };

type OnboardingPending = "create" | "signin" | "unlock" | null;

const TABS: {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "dashboard", label: "Home", icon: "home", iconOutline: "home-outline" },
  { key: "markets", label: "Markets", icon: "stats-chart", iconOutline: "stats-chart-outline" },
  { key: "discover", label: "Traders", icon: "people", iconOutline: "people-outline" },
  { key: "contests", label: "Contests", icon: "trophy", iconOutline: "trophy-outline" },
  { key: "account", label: "Account", icon: "person", iconOutline: "person-outline" },
];

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatConnectedAt(iso: string | null): string | undefined {
  if (iso === null) return undefined;
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return undefined;
  return new Date(at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function App() {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [evm, setEvm] = useState<EvmContext | null>(null);
  const [evmError, setEvmError] = useState<string | null>(null);
  const [pending, setPending] = useState<OnboardingPending>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [tour, setTour] = useState<Tour | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<number | undefined>(
    undefined,
  );
  const [selectedMarketSymbol, setSelectedMarketSymbol] = useState<string | undefined>(
    undefined,
  );
  const [selectedMarketMark, setSelectedMarketMark] = useState<string | undefined>(
    undefined,
  );
  // Trade ticket (S8).
  const [ticketSide, setTicketSide] = useState<"long" | "short">("long");
  const [ticketSize, setTicketSize] = useState("");
  const [ticketLeverage, setTicketLeverage] = useState(10);
  const [ticketMaxLeverage, setTicketMaxLeverage] = useState(20);
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketNotice, setTicketNotice] = useState<string | null>(null);
  // Live backend state (silent anon session + dashboard).
  const [supaReady, setSupaReady] = useState(false);
  const [dash, setDash] = useState<LiveDashboard | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashRefreshing, setDashRefreshing] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  // Perpl connect state (S3): unknown until the first key list loads.
  const [perpl, setPerpl] = useState<{
    state: "unknown" | "unconnected" | "connected";
    hasTradeKey: boolean;
    keyCount: number;
  }>({ state: "unknown", hasTradeKey: false, keyCount: 0 });
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [perplAccounts, setPerplAccounts] = useState<
    { id: string; label: string; connectedAt: string | null }[]
  >([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  // Live trades feed (S9) + kill switch (S5/S12).
  const [fills, setFills] = useState<TradeFillRow[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesRefreshing, setTradesRefreshing] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);
  const [tradesLoaded, setTradesLoaded] = useState(false);
  const [killError, setKillError] = useState<string | null>(null);
  // Realtime tick counters (screens reload on change).
  const [marketsTick, setMarketsTick] = useState(0);
  const [pairTick, setPairTick] = useState(0);
  const rtTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Fund metadata + own handle.
  const [minDeposit, setMinDeposit] = useState("100");
  const [meHandle, setMeHandle] = useState<string | null>(null);
  const [savingHandle, setSavingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  // Leaders + copy (S10/S11/S12).
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [leaderSort, setLeaderSort] = useState("PnL");
  const [leadersLoadedSort, setLeadersLoadedSort] = useState<string | null>(null);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [leadersRefreshing, setLeadersRefreshing] = useState(false);
  const [leadersError, setLeadersError] = useState<string | null>(null);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    handle: string;
    bio: string;
    pnl30d: string;
    pnlUp: boolean;
    pnl24h: string;
    winRate: string;
    sharpe: string;
    maxDrawdown: string;
    followers: string;
    following: boolean;
    positions: { symbol: string; side: "Long" | "Short"; size: string; mark?: string; pnl: string; pnlUp: boolean }[];
    fills: { market: string; side: string; price: string; time: string }[];
  } | null>(null);
  const [profileFor, setProfileFor] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState("");
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copies, setCopies] = useState<
    { leaderId: string; handle: string; allocation: string; status: "Active" | "Paused" }[]
  >([]);
  const [copiesLoaded, setCopiesLoaded] = useState(false);
  const [copiesLoading, setCopiesLoading] = useState(false);
  const [copiesRefreshing, setCopiesRefreshing] = useState(false);
  const [copiesError, setCopiesError] = useState<string | null>(null);
  const leaderSortRef = useRef(leaderSort);
  leaderSortRef.current = leaderSort;
  const accountRef = useRef(account);
  accountRef.current = account;

  // Ends the outgoing session whenever the unlocked wallet leaves the state.
  const replaceAccount = useCallback((next: AccountState): void => {
    const current = accountRef.current;
    if (
      current?.status === "unlocked" &&
      (next.status !== "unlocked" || next.wallet !== current.wallet)
    ) {
      current.wallet.session.end();
    }
    accountRef.current = next;
    setAccount(next);
  }, []);

  // S2: silent anonymous session on launch — the transport identity
  // behind every backend call. Never blocks the UI.
  useEffect(() => {
    let stale = false;
    ensureSession()
      .catch(() => undefined)
      .finally(() => {
        if (!stale) setSupaReady(true);
      });
    return () => {
      stale = true;
    };
  }, []);

  function currentAddress(): string | undefined {
    const current = accountRef.current;
    return current?.status === "unlocked" ? current.wallet.address : undefined;
  }

  const loadDashboard = useCallback(
    async (address: string | undefined, refresh: boolean): Promise<void> => {
      if (refresh) setDashRefreshing(true);
      else setDashLoading(true);
      setDashError(null);
      try {
        const { data, error } = await loadLiveDashboard(address);
        setDash(data);
        // A backend error with no cached data surfaces; pull-to-refresh
        // retries. On-chain balance still shows when present.
        setDashError(error);
      } catch (caught) {
        setDashError(describeError(caught));
      } finally {
        setDashLoading(false);
        setDashRefreshing(false);
      }
    },
    [],
  );

  // First live load once the session exists and Home is reachable.
  useEffect(() => {
    if (!supaReady || dash !== null || dashLoading || dashError !== null) return;
    if (account?.status === "unlocked" || tour !== null) {
      void loadDashboard(currentAddress(), false);
    }
  }, [supaReady, account, tour, dash, dashLoading, dashError, loadDashboard]);

  const loadPerpl = useCallback(async (): Promise<void> => {
    try {
      const accounts = await getAccounts();
      const active = accounts.filter((a) => a.status === "active");
      setPerpl({
        state: active.length > 0 ? "connected" : "unconnected",
        hasTradeKey: active.some((a) => (a.scope_mask & 2) === 2),
        keyCount: active.length,
      });
      setPerplAccounts(
        active.map((a) => ({
          id: a.id,
          label: a.label ?? `Key ${a.id.slice(0, 6)}`,
          connectedAt: a.connected_at,
        })),
      );
    } catch {
      // Key status stays unknown; connect entries remain available.
    }
  }, []);

  // First key-list load with the session.
  useEffect(() => {
    if (!supaReady) return;
    void loadPerpl();
  }, [supaReady, loadPerpl]);

  // S0: launch lands in the locked state (or signed out) with no biometric
  // prompt: only the ungated metadata is read here.
  useEffect(() => {
    let stale = false;
    loadStoredAccount()
      .then((stored) => {
        if (stale) return;
        setAccount(
          stored === undefined
            ? { status: "none" }
            : { status: "locked", ...stored },
        );
      })
      .catch(() => {
        if (!stale) setAccount({ status: "none" });
      });
    return () => {
      stale = true;
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function connectNetwork(): Promise<void> {
      try {
        const context = await resolveEvmContext({
          rpcUrl: DEMO_RPC_URL,
          expectedChainId: DEMO_CHAIN_ID,
        });
        if (!stopped) {
          setEvm(context);
          setEvmError(null);
        }
      } catch (error) {
        if (!stopped) {
          setEvm(null);
          setEvmError(describeError(error));
          timer = setTimeout(() => void connectNetwork(), 5_000);
        }
      }
    }
    void connectNetwork();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  // End the live session when the app unmounts.
  useEffect(
    () => () => {
      const current = accountRef.current;
      if (current?.status === "unlocked") current.wallet.session.end();
    },
    [],
  );

  // S2b: bind wallet ↔ anonymous user in the background (challenge →
  // EIP-191 sign via the mera session → link). Never blocks the UI;
  // failures surface as a dashboard banner with retry on refresh.
  async function linkAndLoad(address: string): Promise<void> {
    try {
      const current = accountRef.current;
      if (current?.status !== "unlocked") return;
      const viemAccount = toViemAccount(current.wallet.session);
      await linkWallet(address, (message: string) =>
        viemAccount.signMessage({ message }),
      );
      setLinkError(null);
    } catch (caught) {
      setLinkError(
        `Wallet sync failed (${describeError(caught)}) — pull to refresh to retry.`,
      );
    } finally {
      await loadDashboard(address, false);
      await loadPerpl();
    }
  }

  // S3: full enroll — fresh device keypair → payload → wallet signature
  // + proof-of-possession → enroll. 404 (no on-chain account) → fund.
  // 409 (key taken) → fresh keypair, retry once.
  async function handleEnrollNew(): Promise<void> {
    const address = currentAddress();
    if (!address) {
      setTour(null);
      return;
    }
    const current = accountRef.current;
    if (current?.status !== "unlocked") {
      setTour(null);
      return;
    }
    const walletSession = current.wallet.session;
    setConnectBusy(true);
    setConnectError(null);
    const attempt = async (): Promise<void> => {
      const { privateKeyHex, publicKeyHex } = await generateEdKeypair();
      const payload = await requestEnrollPayload({
        address,
        publicKey: publicKeyHex,
        scopeMask: 3,
        label: "Perpl Arena",
      });
      const signature = await signEnrollTypedData(
        walletSession,
        payload.typedData,
      );
      const popSignature = await signPopDigest(
        privateKeyHex,
        payload.typedData,
      );
      await enrollKey({
        address,
        typedData: payload.typedData,
        mac: payload.mac,
        signature,
        popSignature,
        privateKey: privateKeyHex,
        label: "Perpl Arena",
      });
    };
    const succeed = async (): Promise<void> => {
      await loadPerpl();
      await loadDashboard(address, false);
      setTour({ tab: "dashboard", stack: [] });
    };
    try {
      await attempt();
      await succeed();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        push("fund");
        return;
      }
      if (caught instanceof ApiError && caught.code === "key_taken") {
        try {
          await attempt();
          await succeed();
          return;
        } catch (retryCaught) {
          setConnectError(describeError(retryCaught));
          return;
        }
      }
      if (caught instanceof ApiError && caught.code === "key_limit") {
        setConnectError(
          "Key limit reached — revoke an existing key at testnet.perpl.xyz/apikeys, then try again.",
        );
        return;
      }
      if (caught instanceof ApiError && caught.code === "enrollment_failed") {
        setConnectError(
          "Perpl rejected the enrollment — use “Import from Perpl web UI” below: create a key at testnet.perpl.xyz/apikeys and paste it here.",
        );
        return;
      }
      setConnectError(describeError(caught));
    } finally {
      setConnectBusy(false);
    }
  }

  async function handleImportKey(input: {
    apiKey: string;
    privateKey: string;
  }): Promise<void> {
    const address = currentAddress();
    if (!address) {
      setTour(null);
      return;
    }
    setConnectBusy(true);
    setConnectError(null);
    try {
      await importKey({
        address,
        apiKey: input.apiKey,
        privateKey: input.privateKey,
        scopeMask: 3,
        label: "Perpl Arena",
      });
      await loadPerpl();
      await loadDashboard(address, false);
      setTour({ tab: "dashboard", stack: [] });
    } catch (caught) {
      setConnectError(describeError(caught));
    } finally {
      setConnectBusy(false);
    }
  }

  const openFundSite = useCallback((): void => {
    void Linking.openURL("https://testnet.perpl.xyz").catch(() => undefined);
  }, []);

  // S1: "Get Mera wallet" creates a new passkey; "Recover wallet" asserts
  // with a synced passkey on a new device. No backend calls.
  async function handleCreate(): Promise<void> {
    setPending("create");
    setOnboardingError(null);
    try {
      const wallet = await createAccount();
      replaceAccount({ status: "unlocked", wallet });
      void linkAndLoad(wallet.address);
    } catch (caught) {
      setOnboardingError(describeError(caught));
    } finally {
      setPending(null);
    }
  }

  // S1: the passkey ceremony is the sole visible auth. Both entries run
  // the assertion — sign-in on this device, recovery via a synced
  // passkey on a new one. No backend calls: S2/S2b stay silent.
  async function handleSignIn(): Promise<void> {
    setPending("signin");
    setOnboardingError(null);
    try {
      const wallet = await signIn();
      replaceAccount({ status: "unlocked", wallet });
      void linkAndLoad(wallet.address);
    } catch (caught) {
      setOnboardingError(describeError(caught));
    } finally {
      setPending(null);
    }
  }

  // Locked renders from stored metadata; biometrics fire only on this tap.
  async function handleUnlock(): Promise<void> {
    if (account === null || account.status !== "locked") return;
    setPending("unlock");
    setOnboardingError(null);
    try {
      const unlocked = await unlockStoredWallet();
      if (unlocked === undefined) {
        await clearStoredAccount();
        replaceAccount({ status: "none" });
        setOnboardingError("The stored account is gone. Sign in again.");
        return;
      }
      if (!isAddressEqual(unlocked.address, account.address)) {
        unlocked.session.end();
        await clearStoredAccount();
        replaceAccount({ status: "none" });
        setOnboardingError(
          "The stored key does not open this account. Sign in again.",
        );
        return;
      }
      replaceAccount({ status: "unlocked", wallet: unlocked });
      void linkAndLoad(unlocked.address);
    } catch (caught) {
      setOnboardingError(describeError(caught));
    } finally {
      setPending(null);
    }
  }

  // Lock: back to the locked state rendered from stored metadata.
  // The stored wallet stays on device; biometrics fire on Unlock.
  async function handleLock(): Promise<void> {
    try {
      const stored = await loadStoredAccount();
      replaceAccount(
        stored === undefined ? { status: "none" } : { status: "locked", ...stored },
      );
    } catch {
      replaceAccount({ status: "none" });
    }
    setTour(null);
  }

  async function handleSignOut(): Promise<void> {    setPending("unlock");
    setOnboardingError(null);
    try {
      await clearStoredAccount();
      // S2: sign-out clears the Supabase session and ends the mera session.
      await clearSession();
    } catch (caught) {
      setOnboardingError(describeError(caught));
      return;
    } finally {
      setPending(null);
    }
    replaceAccount({ status: "none" });
    setTour(null);
    setDash(null);
    setDashError(null);
    setLinkError(null);
    setPerpl({ state: "unknown", hasTradeKey: false, keyCount: 0 });
    setConnectError(null);
    setMeHandle(null);
    setHandleError(null);
  }

  const loadTrades = useCallback(async (refresh: boolean): Promise<void> => {
    if (refresh) setTradesRefreshing(true);
    else setTradesLoading(true);
    setTradesError(null);
    try {
      const [{ fills: rows, error }, exchange] = await Promise.all([
        getTrades(),
        // Exchange-confirmed fills need a trade key; missing key yields [].
        getExchangeFills().catch((): TradeFillRow[] => []),
      ]);
      setFills([...rows, ...exchange]);
      setTradesError(error);
      setTradesLoaded(true);
      // Viewing activity clears the badge (best-effort, silent).
      if (!error) {
        markNotificationsRead()
          .then(() => {
            setDash((current) =>
              current === null ? current : { ...current, unread: 0 },
            );
          })
          .catch(() => undefined);
      }
    } catch (caught) {
      setTradesError(describeError(caught));
    } finally {
      setTradesLoading(false);
      setTradesRefreshing(false);
    }
  }, []);

  const LEADER_SORT_PARAM: Record<string, "pnl" | "pnl24h" | "winRate" | "sharpe" | "followers"> = {
    PnL: "pnl",
    "24h": "pnl24h",
    "Win rate": "winRate",
    Sharpe: "sharpe",
    Followers: "followers",
  };

  function formatSignedMoney(value: number | string | null | undefined): { text: string; up: boolean } {
    const num = Number(value ?? NaN);
    if (!Number.isFinite(num)) return { text: "—", up: true };
    const abs = Math.abs(num).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return { text: `${num < 0 ? "-" : "+"}${abs}`, up: num >= 0 };
  }

  const loadLeaders = useCallback(
    async (sort: string, refresh: boolean): Promise<void> => {
      if (refresh) setLeadersRefreshing(true);
      else setLeadersLoading(true);
      setLeadersError(null);
      try {
        const rows = await getLeaders(LEADER_SORT_PARAM[sort] ?? "pnl");
        setLeaders(
          rows.map((row) => {
            const pnl = formatSignedMoney(row.total_pnl_usd);
            return {
              id: row.user_id,
              handle: row.handle,
              pnl30d: pnl.text,
              pnlUp: pnl.up,
              winRate:
                typeof row.win_rate === "number"
                  ? `${Math.round(row.win_rate * 100)}%`
                  : "—",
              followers: Number(row.followers_count ?? 0).toLocaleString("en-US"),
            };
          }),
        );
        setLeadersLoadedSort(sort);
      } catch (caught) {
        setLeadersError(describeError(caught));
      } finally {
        setLeadersLoading(false);
        setLeadersRefreshing(false);
      }
    },
    [],
  );

  const loadProfile = useCallback(async (id: string): Promise<void> => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const [detail, follows, markets] = await Promise.all([
        getLeader(id),
        getFollows(),
        getMarketsCached().catch(() => []),
      ]);
      const decimals = new Map(
        markets.map((m) => [
          m.market_id,
          { price: m.price_decimals, size: m.size_decimals, symbol: m.symbol },
        ]),
      );
      const profile = detail.profile;
      const pnl = formatSignedMoney(profile.total_pnl_usd);
      const positions = detail.positions.map((p) => {
        const dec = decimals.get(p.market_id) ?? { price: 2, size: 0, symbol: p.symbol ?? `M${p.market_id}` };
        const size = Number(p.size_scaled) / 10 ** dec.size;
        const entry = Number(p.entry_price_scaled) / 10 ** dec.price;
        const last = p.last_price === null ? NaN : Number(p.last_price) / 10 ** dec.price;
        const long = isLongSide(p.side);
        const pnlValue =
          Number.isFinite(size) && Number.isFinite(entry) && Number.isFinite(last)
            ? (long ? 1 : -1) * (last - entry) * size
            : NaN;
        const row = formatSignedMoney(pnlValue);
        const digits = 5;
        return {
          symbol: p.symbol ?? dec.symbol,
          side: (long ? "Long" : "Short") as "Long" | "Short",
          size: Number.isFinite(size)
            ? size.toLocaleString("en-US", { maximumFractionDigits: 6 })
            : "—",
          mark: Number.isFinite(last)
            ? last.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits })
            : undefined,
          pnl: row.text,
          pnlUp: row.up,
        };
      });
      const fills = detail.recentFills.map((f) => {
        const dec = decimals.get(f.market_id) ?? { price: 2, size: 0, symbol: `M${f.market_id}` };
        const price = Number(f.price_scaled) / 10 ** dec.price;
        const side = orderSide(f.order_type);
        return {
          market: dec.symbol,
          side: side ?? "Long",
          price: Number.isFinite(price)
            ? price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 })
            : "Market",
          time: orderTimeLabel(f.at),
        };
      });
      setProfile({
        handle: profile.handle,
        bio: profile.bio ?? "",
        pnl30d: pnl.text,
        pnlUp: pnl.up,
        pnl24h: formatSignedMoney(profile.pnl_24h_usd).text,
        winRate:
          typeof profile.win_rate === "number"
            ? `${Math.round(profile.win_rate * 100)}%`
            : "—",
        sharpe:
          typeof profile.sharpe === "number" ? profile.sharpe.toFixed(2) : "—",
        maxDrawdown:
          typeof profile.max_drawdown === "number"
            ? `${(profile.max_drawdown * 100).toFixed(1)}%`
            : typeof profile.max_drawdown === "string" &&
                profile.max_drawdown !== ""
              ? profile.max_drawdown
              : "—",
        followers: Number(profile.followers_count ?? 0).toLocaleString("en-US"),
        following: follows.some(
          (f) => (f.leader_id ?? f.user_id) === id,
        ),
        positions,
        fills,
      });
      setProfileFor(id);
    } catch (caught) {
      setProfileError(describeError(caught));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadCopies = useCallback(async (refresh: boolean): Promise<void> => {
    if (refresh) setCopiesRefreshing(true);
    else setCopiesLoading(true);
    setCopiesError(null);
    try {
      const settings = await getCopySettings();
      setCopies(
        settings.map((s) => ({
          leaderId: s.leader_id,
          handle: s.leader_handle ?? s.handle ?? `trader-${s.leader_id.slice(0, 6)}`,
          allocation: Number(s.allocation_usd).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          status: (s.paused_reason || s.enabled === false ? "Paused" : "Active") as
            | "Paused"
            | "Active",
        })),
      );
      setCopiesLoaded(true);
    } catch (caught) {
      setCopiesError(describeError(caught));
    } finally {
      setCopiesLoading(false);
      setCopiesRefreshing(false);
    }
  }, []);

  async function handleFollowToggle(): Promise<void> {
    if (!selectedLeaderId || !profile) return;
    setCopyBusy(true);
    try {
      if (profile.following) {
        await unfollowLeader(selectedLeaderId);
      } else {
        await followLeader(selectedLeaderId);
      }
      await loadProfile(selectedLeaderId);
      void loadLeaders(leaderSort, true);
    } catch (caught) {
      setCopyError(describeError(caught));
    } finally {
      setCopyBusy(false);
    }
  }

  // S11: follow (required) then PUT copy settings. No trade key → S3.
  async function handleStartCopy(): Promise<void> {
    if (!selectedLeaderId) return;
    const amount = Number(allocation);
    if (!Number.isFinite(amount) || amount <= 0) {
      setCopyError("Enter an allocation amount in aUSD.");
      return;
    }
    if (!perpl.hasTradeKey) {
      openConnect();
      return;
    }
    setCopyBusy(true);
    setCopyError(null);
    try {
      if (!profile?.following) {
        await followLeader(selectedLeaderId);
      }
      await putCopySettings(selectedLeaderId, { allocationUsd: amount });
      setAllocation("");
      await loadCopies(false);
      await loadDashboard(currentAddress(), true);
      push("copies");
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "no_trade_key") {
        openConnect();
        return;
      }
      setCopyError(describeError(caught));
    } finally {
      setCopyBusy(false);
    }
  }

  async function handleCopyPause(leaderId: string): Promise<void> {
    try {
      await setCopyEnabled(leaderId, false);
      await loadCopies(true);
      await loadDashboard(currentAddress(), true);
    } catch (caught) {
      setCopiesError(describeError(caught));
    }
  }

  async function handleCopyResume(leaderId: string): Promise<void> {
    try {
      await setCopyEnabled(leaderId, true);
      await loadCopies(true);
      await loadDashboard(currentAddress(), true);
    } catch (caught) {
      setCopiesError(describeError(caught));
    }
  }

  async function handleCopyStop(leaderId: string): Promise<void> {
    try {
      await deleteCopy(leaderId);
      await loadCopies(true);
      await loadDashboard(currentAddress(), true);
    } catch (caught) {
      setCopiesError(describeError(caught));
    }
  }

  // Kill switch: pause all copying server-side, then refresh Home.
  async function handleKillSwitch(): Promise<void> {
    setKillError(null);
    try {
      await killSwitch();
      await loadDashboard(currentAddress(), true);
    } catch (caught) {
      setKillError(
        `Kill switch failed (${describeError(caught)}) — try again.`,
      );
    }
  }

  // S8: ticket submit (live or dry run). Idempotency keys make retries safe.
  async function handleTicketSubmit(dryRun: boolean): Promise<void> {
    if (selectedMarketId === undefined) return;
    const size = Number(ticketSize);
    if (!Number.isFinite(size) || size <= 0) {
      setTicketError("Enter an amount greater than zero.");
      return;
    }
    if (!perpl.hasTradeKey) {
      openConnect();
      return;
    }
    setTicketBusy(true);
    setTicketError(null);
    setTicketNotice(null);
    try {
      const { duplicate } = await submitOrder({
        marketId: selectedMarketId,
        side: ticketSide,
        size,
        leverage: Math.min(ticketLeverage, ticketMaxLeverage),
        dryRun,
      });
      if (dryRun) {
        setTicketNotice(
          duplicate
            ? "Dry run already recorded — the worker will simulate it."
            : "Dry run accepted — the worker simulates end-to-end without submitting.",
        );
        return;
      }
      setTicketSize("");
      setTicketNotice(null);
      push("trades");
      setTradesLoaded(false);
      await loadTrades(false);
      await loadDashboard(currentAddress(), true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "no_trade_key") {
        openConnect();
        return;
      }
      setTicketError(describeError(caught));
    } finally {
      setTicketBusy(false);
    }
  }

  function openTicket(side: "long" | "short"): void {
    if (selectedMarketId === undefined) return;
    setTicketSide(side);
    setTicketSize("");
    setTicketError(null);
    setTicketNotice(null);
    void getMarketsCached()
      .then((markets) => {
        const market = markets.find((m) => m.market_id === selectedMarketId);
        if (market) {
          const max = Math.max(
            1,
            Math.floor(10000 / (market.initial_margin || 10000)),
          );
          setTicketMaxLeverage(Math.min(max, 50));
          setTicketLeverage((current) => Math.min(current, Math.min(max, 50)));
        }
      })
      .catch(() => undefined);
    push("ticket");
  }

  // aUSD transfer (Home Send sheet): wallet-signed ERC-20 transfer.
  async function handleSendAusd(to: string, amount: number): Promise<string> {
    const current = accountRef.current;
    if (current?.status !== "unlocked") {
      throw new Error("Unlock your wallet to send.");
    }
    const hash = await transferAusd(current.wallet.session, to, amount);
    void loadDashboard(currentAddress(), true);
    return hash;
  }

  // Tournaments (S13).
  const [tournaments, setTournaments] = useState<
    { id: string; name: string; status: "Live" | "Upcoming" | "Ended"; entrants: string; prize: string; rank?: string }[]
  >([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  // Tournament standings detail.
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(
    null,
  );
  const [standings, setStandings] = useState<{
    name: string;
    status: string;
    prize: string;
    entries: StandingsEntry[];
  } | null>(null);
  const [standingsFor, setStandingsFor] = useState<string | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  // Copy-settings editor.
  const [editingCopy, setEditingCopy] = useState<{
    leaderId: string;
    handle: string;
    form: CopySettingsForm;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadTournaments = useCallback(async (): Promise<void> => {
    setTournamentsLoading(true);
    setTournamentsError(null);
    try {
      const [rows, entries] = await Promise.all([
        getTournaments(),
        getMyTournamentEntries().catch(() => []),
      ]);
      setTournaments(
        rows.map((t) => ({
          id: t.id,
          name: t.name,
          // Backend statuses: scheduled | active | settled.
          status:
            t.status === "active" || t.status === "Live"
              ? "Live"
              : t.status === "settled" || t.status === "Ended"
                ? "Ended"
                : "Upcoming",
          entrants: String(t.entrants ?? t.entries ?? "0"),
          prize:
            t.prize ??
            (t.prize_pool_usd === null || t.prize_pool_usd === undefined
              ? "—"
              : `$${Number(t.prize_pool_usd).toLocaleString("en-US")}`),
          rank: t.rank ?? undefined,
        })),
      );
      setJoinedIds(entries.map((e) => e.tournament_id));
    } catch (caught) {
      setTournamentsError(describeError(caught));
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  async function handleJoinTournament(id: string): Promise<void> {
    setJoiningId(id);
    try {
      await joinTournament(id);
      await loadTournaments();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "no_account") {
        openConnect();
        return;
      }
      setTournamentsError(describeError(caught));
    } finally {
      setJoiningId(null);
    }
  }

  const loadStandings = useCallback(async (id: string): Promise<void> => {
    setStandingsLoading(true);
    setStandingsError(null);
    try {
      const detail = await getTournamentDetail(id);
      const tournament = detail.tournament;
      const entries: StandingsEntry[] = detail.standings.map((s, index) => ({
        rank: String(s.rank ?? index + 1),
        handle: s.handle ?? `trader-${String(s.user_id).slice(0, 6)}`,
        score:
          typeof s.score === "number"
            ? s.score.toFixed(1)
            : (s.score ?? "—").toString(),
        netPnl:
          typeof s.net_pnl === "number"
            ? formatSignedMoney(s.net_pnl).text
            : (s.net_pnl ?? "—").toString(),
      }));
      const name =
        typeof tournament.name === "string" ? tournament.name : "Tournament";
      setStandings({
        name,
        status:
          typeof tournament.status === "string" ? tournament.status : "",
        prize:
          typeof tournament.prize === "string" ? tournament.prize : "—",
        entries,
      });
      setStandingsFor(id);
    } catch (caught) {
      setStandingsError(describeError(caught));
    } finally {
      setStandingsLoading(false);
    }
  }, []);

  function openStandings(id: string): void {
    setSelectedTournamentId(id);
    setStandings(null);
    setStandingsFor(null);
    setStandingsError(null);
    push("standings");
  }

  async function openEditCopy(leaderId: string): Promise<void> {
    setEditSaving(true);
    setEditError(null);
    try {
      const settings = await getCopySettings();
      const current = settings.find((s) => s.leader_id === leaderId);
      if (!current) {
        setEditError("Copy setting not found — pull to refresh.");
        return;
      }
      setEditingCopy({
        leaderId,
        handle:
          current.leader_handle ?? current.handle ?? `trader-${leaderId.slice(0, 6)}`,
        form: {
          allocation: String(current.allocation_usd ?? ""),
          maxLeverage: String(current.max_leverage ?? 3),
          maxNotional: String(current.max_notional_per_trade_usd ?? 5000),
          dailyLoss: String(current.daily_loss_limit_usd ?? 50),
          slippage: String(current.slippage_bps ?? 50),
          stopLoss: String(current.stop_loss_bps ?? 2000),
        },
      });
      push("editCopy");
    } catch (caught) {
      setEditError(describeError(caught));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleSaveCopySettings(form: CopySettingsForm): Promise<void> {
    if (!editingCopy) return;
    const amount = Number(form.allocation);
    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("Enter an allocation amount in aUSD.");
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await putCopySettings(editingCopy.leaderId, {
        allocationUsd: amount,
        maxLeverage: Number(form.maxLeverage) || 3,
        maxNotionalPerTradeUsd: Number(form.maxNotional) || 5000,
        dailyLossLimitUsd: Number(form.dailyLoss) || 50,
        slippageBps: Number(form.slippage) || 50,
        stopLossBps: Number(form.stopLoss) || 2000,
      });
      await loadCopies(true);
      await loadDashboard(currentAddress(), true);
      pop();
      setEditingCopy(null);
    } catch (caught) {
      setEditError(describeError(caught));
    } finally {
      setEditSaving(false);
    }
  }

  // Revoke a Perpl key (local revoke; Perpl UI revocation is separate).
  async function handleRevokeKey(id: string): Promise<void> {
    setRevokingId(id);
    try {
      await revokeAccount(id);
      await loadPerpl();
      await loadDashboard(currentAddress(), true);
    } catch (caught) {
      setKillError(`Revoke failed (${describeError(caught)}) — try again.`);
    } finally {
      setRevokingId(null);
    }
  }

  // Own trader profile (S14).
  const [leaderProfile, setLeaderProfile] = useState<{
    isPublic: boolean;
    bio: string;
  } | null>(null);

  const loadLeaderProfile = useCallback(async (): Promise<void> => {
    try {
      const me = await getMe();
      if (!me.id) return;
      const detail = await getLeader(me.id);
      setLeaderProfile({
        isPublic: detail.profile.is_public ?? false,
        bio: detail.profile.bio ?? "",
      });
    } catch {
      setLeaderProfile((current) => current ?? { isPublic: false, bio: "" });
    }
  }, []);

  async function handleSaveLeaderProfile(input: {
    isPublic: boolean;
    bio: string;
  }): Promise<void> {
    setSavingProfile(true);
    setProfileSaveError(null);
    try {
      await putLeaderProfile({ isPublic: input.isPublic, bio: input.bio });
      setLeaderProfile(input);
    } catch (caught) {
      setProfileSaveError(describeError(caught));
    } finally {
      setSavingProfile(false);
    }
  }

  // One-click trading flag (wallet-signed contract call).
  const [oneClickBusy, setOneClickBusy] = useState(false);
  const [oneClickError, setOneClickError] = useState<string | null>(null);
  const [oneClickDone, setOneClickDone] = useState(false);

  async function handleEnableOneClick(): Promise<void> {
    const current = accountRef.current;
    if (current?.status !== "unlocked") {
      setTour(null);
      return;
    }
    setOneClickBusy(true);
    setOneClickError(null);
    try {
      await setOrderForwarding(current.wallet.session, true);
      setOneClickDone(true);
    } catch (caught) {
      setOneClickError(describeError(caught));
    } finally {
      setOneClickBusy(false);
    }
  }

  // Pull-to-refresh: retry a failed wallet link first, then reload.
  async function handleDashboardRefresh(): Promise<void> {    const current = accountRef.current;
    if (linkError !== null && current?.status === "unlocked") {
      try {
        const viemAccount = toViemAccount(current.wallet.session);
        await linkWallet(current.wallet.address, (message: string) =>
          viemAccount.signMessage({ message }),
        );
        setLinkError(null);
      } catch (caught) {
        setLinkError(
          `Wallet sync failed (${describeError(caught)}) — pull to refresh to retry.`,
        );
      }
    }
    await loadDashboard(currentAddress(), true);
  }

  const busy = pending !== null;
  const statusText =
    pending === "create"
      ? "Creating wallet…"
      : pending === "signin"
        ? "Waiting for passkey…"
        : pending === "unlock"
          ? "Unlocking…"
          : undefined;

  // Tour navigation (UI-only, mock data throughout).
  const push = useCallback((key: StackKey): void => {
    setTour((current) =>
      current === null
        ? { tab: "dashboard", stack: [key] }
        : { tab: current.tab, stack: [...current.stack, key] },
    );
  }, []);

  const pop = useCallback((): void => {
    setTour((current) => {
      if (current === null || current.stack.length === 0) return current;
      const stack = current.stack.slice(0, -1);
      // Pre-auth tour exits back to onboarding once its stack drains.
      if (stack.length === 0 && accountRef.current?.status !== "unlocked") {
        return null;
      }
      return { tab: current.tab, stack };
    });
  }, []);

  const goTab = useCallback((tab: TabKey): void => {
    setTour({ tab, stack: [] });
  }, []);

  const enterTour = useCallback((): void => {
    setTour({ tab: "dashboard", stack: ["connect"] });
  }, []);

  const enterHome = useCallback((): void => {
    setTour({ tab: "dashboard", stack: [] });
  }, []);

  // Deferred connect entry points (Home banner, Account row): login
  // first, connect later. Without a wallet, route back to onboarding.
  const openConnect = useCallback((): void => {
    if (accountRef.current?.status !== "unlocked") {
      setTour(null);
      return;
    }
    setConnectError(null);
    push("connect");
  }, [push]);

  const handleFundContinue = useCallback((): void => {
    // Back to connect: the user retries enrollment, which re-checks the
    // on-chain account. Refresh the balance on the way.
    pop();
    void loadDashboard(currentAddress(), true);
  }, [pop, loadDashboard]);

  // Derived router state — computed before any early return so hook
  // order stays stable across renders (hooks must run unconditionally).
  // Pre-auth and unlocked-but-not-touring land on S1 (real handlers).
  const activeTour: Tour | { tab: "dashboard"; stack: never[] } | null =
    account === null
      ? null
      : (tour ?? (account.status === "unlocked" ? { tab: "dashboard", stack: [] } : null));

  const top = activeTour?.stack[activeTour.stack.length - 1] ?? null;
  const activeTab = top === null ? (activeTour?.tab ?? null) : null;

  // Live trades load on entering the Trades stack.
  useEffect(() => {
    if (top === "trades" && !tradesLoaded && !tradesLoading) {
      void loadTrades(false);
    }
  }, [top, tradesLoaded, tradesLoading, loadTrades]);

  // Leaders load on entering Traders, per sort.
  useEffect(() => {
    if (
      activeTab === "discover" &&
      leadersLoadedSort !== leaderSort &&
      !leadersLoading &&
      !leadersRefreshing
    ) {
      void loadLeaders(leaderSort, leadersLoadedSort !== null);
    }
  }, [activeTab, leaderSort, leadersLoadedSort, leadersLoading, leadersRefreshing, loadLeaders]);

  // Profile loads on entering it, per trader.
  useEffect(() => {
    if (top === "profile" && selectedLeaderId && profileFor !== selectedLeaderId && !profileLoading) {
      void loadProfile(selectedLeaderId);
    }
  }, [top, selectedLeaderId, profileFor, profileLoading, loadProfile]);

  // Copies load on entering the manager.
  useEffect(() => {
    if (top === "copies" && !copiesLoaded && !copiesLoading) {
      void loadCopies(false);
    }
  }, [top, copiesLoaded, copiesLoading, loadCopies]);

  // Standings load on entering the detail stack, per tournament.
  useEffect(() => {
    if (
      top === "standings" &&
      selectedTournamentId &&
      standingsFor !== selectedTournamentId &&
      !standingsLoading
    ) {
      void loadStandings(selectedTournamentId);
    }
  }, [top, selectedTournamentId, standingsFor, standingsLoading, loadStandings]);

  // Realtime → debounced silent reloads (appflow §3 subscription map).
  // Loaders only show spinners when no data exists yet, so ticks refresh
  // quietly in the background.
  const scheduleReload = useCallback(
    (key: string, ms: number, fn: () => void): void => {
      const existing = rtTimers.current.get(key);
      if (existing) clearTimeout(existing);
      rtTimers.current.set(
        key,
        setTimeout(() => {
          rtTimers.current.delete(key);
          fn();
        }, ms),
      );
    },
    [],
  );

  useEffect(() => {
    if (!supaReady) return;
    const unsubs = [
      feed.subscribe("price_cache", () => {
        scheduleReload("markets", 4000, () => setMarketsTick((t) => t + 1));
        scheduleReload("pair", 4000, () => setPairTick((t) => t + 1));
      }),
      ...["positions", "copy_orders", "manual_orders", "notifications", "risk_events"].map(
        (table) =>
          feed.subscribe(table, () => {
            scheduleReload("dash", 4000, () =>
              void loadDashboard(currentAddress(), false),
            );
            scheduleReload("trades", 5000, () => void loadTrades(false));
            scheduleReload("copies", 5000, () => void loadCopies(false));
          }),
      ),
      feed.subscribe("leaderboard_snapshots", () => {
        scheduleReload("leaders", 5000, () =>
          void loadLeaders(leaderSortRef.current, false),
        );
      }),
    ];
    feed.start();
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [supaReady, scheduleReload, loadDashboard, loadTrades, loadCopies, loadLeaders]);

  // Fund metadata (min deposit) loads on entering Fund; own handle
  // loads on entering Account. Both are cached/cheap.
  useEffect(() => {
    if (top === "fund") {
      getAccountCreation()
        .then((meta) => {
          if (Number.isFinite(meta.minAccountOpenAmount.amount)) {
            setMinDeposit(String(meta.minAccountOpenAmount.amount));
          }
        })
        .catch(() => undefined);
    }
  }, [top]);

  const loadMeHandle = useCallback(async (): Promise<void> => {
    try {
      const me = await getMe();
      if (me.handle) setMeHandle(me.handle);
    } catch {
      // Handle stays at its placeholder; retry on next visit.
    }
  }, []);

  useEffect(() => {
    if (activeTab === "account") {
      void loadMeHandle();
      void loadLeaderProfile();
    }
  }, [activeTab, loadMeHandle, loadLeaderProfile]);

  useEffect(() => {
    if (activeTab === "contests") {
      void loadTournaments();
    }
  }, [activeTab, loadTournaments]);

  if (account === null) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.onboardingScreen}>
          <StatusBar barStyle="dark-content" />
          <SplashScreen connected={evm !== null} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (activeTour === null) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.onboardingScreen}>
          <StatusBar barStyle="dark-content" />
          <OnboardingScreen
            stage={account.status === "locked" ? "locked" : "welcome"}
            address={
              account.status === "locked"
                ? truncate(account.address)
                : undefined
            }
            statusText={statusText}
            error={
              onboardingError === null ? null : { message: onboardingError }
            }
            busy={busy}
            onCreate={() => void handleCreate()}
            onSignIn={() => void handleSignIn()}
            onRecover={() => void handleSignIn()}
            onUnlock={() => void handleUnlock()}
            onSignOut={() => void handleSignOut()}
            onTour={enterTour}
            onContinue={enterHome}
            onRetry={() => setOnboardingError(null)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  async function handleSaveHandle(handle: string): Promise<void> {
    setSavingHandle(true);
    setHandleError(null);
    try {
      const me = await updateHandle(handle);
      if (me.handle) setMeHandle(me.handle);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === "conflict") {
        setHandleError("That handle is taken — try another.");
        return;
      }
      setHandleError(describeError(caught));
    } finally {
      setSavingHandle(false);
    }
  }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.tour}>
          {top === "connect" ? (
            <ConnectPerplScreen
              address={currentAddress() ?? ""}
              busy={connectBusy}
              error={
                connectError === null ? null : { message: connectError }
              }
              onEnrollNew={() => void handleEnrollNew()}
              onImportKey={(input) => void handleImportKey(input)}
              onGoFund={() => push("fund")}
              onRetry={() => setConnectError(null)}
              onBack={pop}
            />
          ) : top === "fund" ? (
            <FundScreen
              balance={dash?.available ?? "0.00"}
              minDeposit={minDeposit}
              oneClickBusy={oneClickBusy}
              oneClickError={oneClickError}
              oneClickDone={oneClickDone}
              onEnableOneClick={() => void handleEnableOneClick()}
              onBack={pop}
              onOpenSite={openFundSite}
              onContinue={handleFundContinue}
            />
          ) : top === "withdraw" ? (
            <WithdrawScreen
              balance={dash?.available ?? "0.00"}
              onOpenSite={openFundSite}
              onBack={pop}
            />
          ) : top === "pair" ? (
            <PairDetailScreen
              marketId={selectedMarketId}
              refreshToken={pairTick}
              position={
                selectedMarketSymbol
                  ? (dash?.positions.find((p) => p.symbol === selectedMarketSymbol) ?? null)
                  : null
              }
              onBack={pop}
              onTrade={(side) => openTicket(side)}
              onCopyTrader={() => goTab("discover")}
            />
          ) : top === "ticket" ? (
            <TradeTicketScreen
              symbol={selectedMarketSymbol ? `${selectedMarketSymbol}-PERP` : undefined}
              mark={selectedMarketMark ?? dash?.positions.find((p) => p.symbol === selectedMarketSymbol)?.mark}
              balance={dash?.available}
              side={ticketSide}
              size={ticketSize}
              leverage={ticketLeverage}
              maxLeverage={ticketMaxLeverage}
              busy={ticketBusy}
              error={ticketError === null ? null : { message: ticketError }}
              notice={ticketNotice}
              onSizeChange={setTicketSize}
              onLeverageChange={setTicketLeverage}
              onSubmit={() => void handleTicketSubmit(false)}
              onDryRun={() => void handleTicketSubmit(true)}
              onBack={pop}
            />
          ) : top === "trades" ? (
            <TradesScreen
              fills={fills}
              realizedPnlToday={dash?.realizedPnlToday ?? "+0.00"}
              realizedPnlUp={dash?.realizedPnlUp ?? true}
              loading={tradesLoading && !tradesLoaded}
              loadError={!tradesLoaded ? tradesError : null}
              refreshing={tradesRefreshing}
              onRefresh={() => void loadTrades(true)}
              onBack={pop}
            />
          ) : top === "profile" ? (
            <TraderProfileScreen
              handle={profile?.handle}
              bio={profile?.bio}
              pnl30d={profile?.pnl30d}
              pnlUp={profile?.pnlUp}
              pnl24h={profile?.pnl24h}
              winRate={profile?.winRate}
              sharpe={profile?.sharpe}
              maxDrawdown={profile?.maxDrawdown}
              followers={profile?.followers}
              following={profile?.following ?? false}
              busy={copyBusy}
              loading={profileLoading && profileFor !== selectedLeaderId}
              loadError={profileFor !== selectedLeaderId ? profileError : null}
              positions={profile?.positions ?? []}
              fills={profile?.fills ?? []}
              allocation={allocation}
              copyError={copyError}
              onBack={pop}
              onFollow={() => void handleFollowToggle()}
              onUnfollow={() => void handleFollowToggle()}
              onAllocationChange={(value) => {
                setAllocation(value);
                setCopyError(null);
              }}
              onStartCopy={() => void handleStartCopy()}
              onRetry={() =>
                selectedLeaderId ? void loadProfile(selectedLeaderId) : undefined
              }
            />
          ) : top === "copies" ? (
            <CopyManagementScreen
              copies={copies}
              loading={copiesLoading && !copiesLoaded}
              loadError={copiesError}
              refreshing={copiesRefreshing}
              onRefresh={() => void loadCopies(true)}
              onBack={pop}
              onPause={(id) => void handleCopyPause(id)}
              onResume={(id) => void handleCopyResume(id)}
              onStop={(id) => void handleCopyStop(id)}
              onEdit={(id) => void openEditCopy(id)}
              onKillSwitch={() => void handleKillSwitch()}
            />
          ) : top === "editCopy" ? (
            <CopySettingsScreen
              handle={editingCopy?.handle}
              initial={editingCopy?.form}
              saving={editSaving}
              saveError={editError}
              onSave={(form) => void handleSaveCopySettings(form)}
              onBack={pop}
            />
          ) : top === "standings" ? (
            <TournamentStandingsScreen
              name={standings?.name}
              status={standings?.status}
              prize={standings?.prize}
              entries={standings?.entries ?? []}
              myRank={
                selectedTournamentId
                  ? (tournaments.find((t) => t.id === selectedTournamentId)?.rank ??
                    null)
                  : null
              }
              loading={standingsLoading && standings === null}
              loadError={standings === null ? standingsError : null}
              onBack={pop}
              onRetry={() =>
                selectedTournamentId
                  ? void loadStandings(selectedTournamentId)
                  : undefined
              }
            />
          ) : top === "export" ? (
            <ExportScreen
              credentialId={
                account.status === "unlocked"
                  ? account.wallet.credentialId
                  : account.status === "locked"
                    ? account.credentialId
                    : undefined
              }
              onBack={pop}
            />
          ) : activeTour.tab === "markets" ? (
            <MarketsScreen
              refreshToken={marketsTick}
              heldSymbols={dash?.positions.map((p) => p.symbol.toUpperCase())}
              onSelectMarket={(id, symbol) => {
                setSelectedMarketId(id);
                setSelectedMarketSymbol(symbol);
                setSelectedMarketMark(undefined);
                // Live mark for the ticket (positions only cover held markets).
                void getMarketsCached()
                  .then((markets) => {
                    const market = markets.find((m) => m.market_id === id);
                    if (market) setSelectedMarketMark(toMarketRow(market).mark);
                  })
                  .catch(() => undefined);
                push("pair");
              }}
            />
          ) : activeTour.tab === "discover" ? (
            <DiscoverScreen
              leaders={leaders}
              sort={leaderSort}
              loading={leadersLoading && leadersLoadedSort === null}
              loadError={leadersLoadedSort === null ? leadersError : null}
              refreshing={leadersRefreshing}
              onRefresh={() => void loadLeaders(leaderSort, true)}
              onSortChange={(sort) => setLeaderSort(sort)}
              onSelectTrader={(id) => {
                setSelectedLeaderId(id);
                setCopyError(null);
                push("profile");
              }}
            />
          ) : activeTour.tab === "contests" ? (
            <TournamentsScreen
              tournaments={tournaments}
              joinedIds={joinedIds}
              joiningId={joiningId}
              loading={tournamentsLoading && tournaments.length === 0}
              loadError={tournaments.length === 0 ? tournamentsError : null}
              onJoin={(id) => void handleJoinTournament(id)}
              onSelect={(id) => openStandings(id)}
              onRetry={() => void loadTournaments()}
            />
          ) : activeTour.tab === "account" ? (
            <AccountScreen
              address={
                account.status === "locked"
                  ? truncate(account.address)
                  : account.status === "unlocked"
                    ? truncate(account.wallet.address)
                    : undefined
              }
              handle={meHandle ?? undefined}
              connectedAt={formatConnectedAt(
                perplAccounts.find((k) => k.connectedAt !== null)?.connectedAt ??
                  null,
              )}
              perplStatus={
                perpl.state === "connected"
                  ? `Connected · ${perpl.keyCount} key${perpl.keyCount === 1 ? "" : "s"}`
                  : perpl.state === "unconnected"
                    ? "Not connected"
                    : undefined
              }
              onConnectPerpl={openConnect}
              handleError={handleError}
              savingHandle={savingHandle}
              onSaveHandle={(handle) => void handleSaveHandle(handle)}
              keys={perplAccounts}
              revokingId={revokingId}
              onRevokeKey={(id) => void handleRevokeKey(id)}
              leaderProfile={leaderProfile}
              savingProfile={savingProfile}
              profileError={profileSaveError}
              onSaveLeaderProfile={(input) => void handleSaveLeaderProfile(input)}
              onLock={() => void handleLock()}
              onExport={() => push("export")}
              onWithdraw={() => push("withdraw")}
              onSignOut={() => {
                if (account.status === "unlocked") void handleSignOut();
                else setTour(null);
              }}
            />
          ) : (
            <DashboardScreen
              equity={dash?.equity ?? "0.00"}
              available={dash?.available}
              walletAddress={
                account.status === "unlocked"
                  ? account.wallet.address
                  : undefined
              }
              onSendAusd={(to, amount) => handleSendAusd(to, amount)}
              lastUpdatedSecondsAgo={dash?.lastUpdatedSecondsAgo ?? 0}
              unread={dash?.unread ?? 0}
              realizedPnlToday={dash?.realizedPnlToday ?? "+0.00"}
              realizedPnlUp={dash?.realizedPnlUp ?? true}
              riskNotice={linkError ?? killError}
              positions={dash?.positions ?? []}
              copies={dash?.copies ?? []}
              activity={dash?.activity ?? []}
              loading={dashLoading && dash === null}
              loadError={dash === null ? dashError : null}
              refreshing={dashRefreshing}
              onRefresh={() => void handleDashboardRefresh()}
              perplConnected={
                currentAddress() !== undefined && perpl.state !== "unknown"
                  ? perpl.state === "connected"
                  : undefined
              }
              onConnectPerpl={openConnect}
              onKillSwitch={() => void handleKillSwitch()}
              onMarkets={() => goTab("markets")}
              onCopyTrader={() => goTab("discover")}
              onManageCopies={() => push("copies")}
              onSeeActivity={() => push("trades")}
            />
          )}
        </View>
        {top === null ? (
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const active = tab.key === activeTour.tab;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="tab"
                  accessibilityLabel={tab.label}
                  hitSlop={4}
                  onPress={() => goTab(tab.key)}
                  style={styles.tab}
                >
                  {active ? <View style={styles.tabDot} /> : null}
                  <Ionicons
                    name={active ? tab.icon : tab.iconOutline}
                    size={24}
                    color={active ? INK : MUTED}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      active ? styles.tabActiveText : styles.tabIdleText,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: PAPER, flex: 1 },
  onboardingScreen: { backgroundColor: PAPER, flex: 1 },
  tab: {
    alignItems: "center",
    gap: 3,
    minHeight: 52,
    minWidth: 60,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabActiveText: { color: INK },
  tabBar: {
    backgroundColor: PAPER,
    borderTopColor: BORDER,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    ...SHADOW_SOFT,
    shadowOffset: { width: 0, height: -8 },
  },
  tabDot: {
    backgroundColor: INDIGO,
    borderRadius: RADIUS.pill,
    height: 5,
    width: 5,
  },
  tabIdleText: { color: MUTED },
  tabLabel: { fontSize: 11, fontWeight: "600", lineHeight: 14 },
  tour: { flex: 1 },
});
