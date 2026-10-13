import {
  DEMO_CHAIN_ID,
  DEMO_RPC_URL,
  type EvmContext,
  resolveEvmContext,
} from "@category-labs/mera-demo-shared/network";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { isAddressEqual } from "viem";
import { type AccountState } from "./src/account";
import { clearStoredAccount, loadStoredAccount } from "./src/storage";
import {
  AccountScreen,
  ConnectPerplScreen,
  CopyManagementScreen,
  DashboardScreen,
  DiscoverScreen,
  FundScreen,
  MarketsScreen,
  OnboardingScreen,
  PairDetailScreen,
  SplashScreen,
  TradeTicketScreen,
  TradesScreen,
  TraderProfileScreen,
  TournamentsScreen,
} from "./src/screens";
import { palette, radii, spacing } from "./src/theme";
import {
  describeError,
  signIn,
  unlockStoredWallet,
} from "./src/wallet";

// UI-only tour router (no backend): tabs per appflow §6 — Home · Markets ·
// Traders · Contests · Account — with stack pushes for detail screens and
// the S1→S3→S4 modal flow over first launch.
type TabKey = "dashboard" | "markets" | "discover" | "contests" | "account";
type StackKey =
  | "connect"
  | "fund"
  | "pair"
  | "ticket"
  | "trades"
  | "profile"
  | "copies";
type Tour = { tab: TabKey; stack: StackKey[] };

type OnboardingPending = "signin" | "unlock" | null;

const TABS: { key: TabKey; label: string; glyph: string }[] = [
  { key: "dashboard", label: "Home", glyph: "●" },
  { key: "markets", label: "Markets", glyph: "◐" },
  { key: "discover", label: "Traders", glyph: "○" },
  { key: "contests", label: "Contests", glyph: "✦" },
  { key: "account", label: "Account", glyph: "◉" },
];

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function App() {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [evm, setEvm] = useState<EvmContext | null>(null);
  const [evmError, setEvmError] = useState<string | null>(null);
  const [pending, setPending] = useState<OnboardingPending>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [tour, setTour] = useState<Tour | null>(null);
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

  // S1: the passkey ceremony is the sole visible auth. Both entries run
  // the assertion — sign-in on this device, recovery via a synced
  // passkey on a new one. No backend calls: S2/S2b stay silent.
  async function handleSignIn(): Promise<void> {
    setPending("signin");
    setOnboardingError(null);
    try {
      const wallet = await signIn();
      replaceAccount({ status: "unlocked", wallet });
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
    } catch (caught) {
      setOnboardingError(describeError(caught));
    } finally {
      setPending(null);
    }
  }

  async function handleSignOut(): Promise<void> {
    setPending("unlock");
    setOnboardingError(null);
    try {
      await clearStoredAccount();
    } catch (caught) {
      setOnboardingError(describeError(caught));
      return;
    } finally {
      setPending(null);
    }
    replaceAccount({ status: "none" });
    setTour(null);
  }

  const busy = pending !== null;
  const statusText =
    pending === "signin"
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

  if (account === null) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <StatusBar barStyle="light-content" />
          <SplashScreen connected={evm !== null} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Pre-auth and unlocked-but-not-touring land on S1 (real handlers).
  const activeTour =
    tour ?? (account.status === "unlocked" ? { tab: "dashboard", stack: [] } : null);
  if (activeTour === null) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <StatusBar barStyle="light-content" />
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
            onSignIn={() => void handleSignIn()}
            onRecover={() => void handleSignIn()}
            onUnlock={() => void handleUnlock()}
            onSignOut={() => void handleSignOut()}
            onTour={enterTour}
            onRetry={() => setOnboardingError(null)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const top = activeTour.stack[activeTour.stack.length - 1] ?? null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.tour}>
          {top === "connect" ? (
            <ConnectPerplScreen
              onBack={pop}
              onEnroll={() => push("fund")}
              onImport={enterHome}
              onGoFund={() => push("fund")}
            />
          ) : top === "fund" ? (
            <FundScreen onBack={pop} onOpenFaucet={enterHome} onDeposited={enterHome} />
          ) : top === "pair" ? (
            <PairDetailScreen
              onBack={pop}
              onTrade={() => push("ticket")}
              onCopyTrader={() => push("profile")}
            />
          ) : top === "ticket" ? (
            <TradeTicketScreen onBack={pop} />
          ) : top === "trades" ? (
            <TradesScreen onBack={pop} />
          ) : top === "profile" ? (
            <TraderProfileScreen onBack={pop} onStartCopy={() => push("copies")} />
          ) : top === "copies" ? (
            <CopyManagementScreen onBack={pop} />
          ) : activeTour.tab === "markets" ? (
            <MarketsScreen onSelectMarket={() => push("pair")} />
          ) : activeTour.tab === "discover" ? (
            <DiscoverScreen onSelectTrader={() => push("profile")} />
          ) : activeTour.tab === "contests" ? (
            <TournamentsScreen />
          ) : activeTour.tab === "account" ? (
            <AccountScreen
              address={
                account.status === "locked"
                  ? truncate(account.address)
                  : account.status === "unlocked"
                    ? truncate(account.wallet.address)
                    : undefined
              }
              onSignOut={() => {
                if (account.status === "unlocked") void handleSignOut();
                else setTour(null);
              }}
            />
          ) : (
            <DashboardScreen
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
                  hitSlop={4}
                  onPress={() => goTab(tab.key)}
                  style={[styles.tab, active ? styles.tabActive : null]}
                >
                  <Text
                    style={[
                      styles.tabGlyph,
                      active ? styles.tabActiveText : styles.tabIdleText,
                    ]}
                  >
                    {tab.glyph}
                  </Text>
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
  screen: { backgroundColor: palette.bg, flex: 1 },
  tab: {
    alignItems: "center",
    borderRadius: radii.pill,
    gap: 2,
    minHeight: 52,
    minWidth: 60,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabActive: { backgroundColor: palette.surfaceMuted },
  tabActiveText: { color: palette.ink },
  tabBar: {
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabGlyph: { fontSize: 16, fontWeight: "600", lineHeight: 20 },
  tabIdleText: { color: palette.ash },
  tabLabel: { fontSize: 11, fontWeight: "500", lineHeight: 14 },
  tour: { flex: 1 },
});
