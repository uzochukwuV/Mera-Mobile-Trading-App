import type { ReactNode } from "react";

export type PositionRow = {
  symbol: string;
  side: "Long" | "Short";
  size: string;
  mark?: string;
  pnl: string;
  pnlUp: boolean;
};

export type CopyRow = {
  handle: string;
  allocation: string;
  status: "Active" | "Paused" | "Stopped";
};

export type ActivityRow = {
  id: string;
  title: string;
  detail: string;
  status: "Pending" | "Submitted" | "Open" | "Partial" | "Filled" | "Failed";
  tone: "neutral" | "ok" | "error" | "warning";
};

export type SplashProps = {
  networkName?: string;
  connected?: boolean;
  statusText?: string;
};

export type OnboardingProps = {
  stage?: "welcome" | "locked" | "working" | "success" | "error";
  steps?: { title: string; body: string; state: "idle" | "working" | "done" | "failed" }[];
  address?: string;
  statusText?: string;
  error?: { code?: string; message: string } | null;
  busy?: boolean;
  onCreate?: () => void;
  onSignIn?: () => void;
  onRecover?: () => void;
  onUnlock?: () => void;
  onSignOut?: () => void;
  onTour?: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
};

export type ConnectPerplProps = {
  address: string;
  busy?: boolean;
  error?: { code?: string; message: string } | null;
  onEnrollNew?: () => void;
  onImportKey?: (input: { apiKey: string; privateKey: string }) => void;
  onGoFund?: () => void;
  onRetry?: () => void;
  onBack?: () => void;
};

export type FundProps = {
  balance?: string;
  minDeposit?: string;
  oneClickBusy?: boolean;
  oneClickError?: string | null;
  oneClickDone?: boolean;
  onEnableOneClick?: () => void;
  onOpenSite?: () => void;
  onContinue?: () => void;
  onBack?: () => void;
};

export type ExportProps = {
  credentialId?: string;
  onBack?: () => void;
};

export type WithdrawProps = {
  balance?: string;
  onOpenSite?: () => void;
  onBack?: () => void;
};

export type DashboardProps = {
  equity?: string;
  changePct?: number;
  lastUpdatedSecondsAgo?: number;
  unread?: number;
  available?: string;
  locked?: string;
  realizedPnlToday?: string;
  realizedPnlUp?: boolean;
  riskNotice?: string | null;
  positions?: PositionRow[];
  copies?: CopyRow[];
  activity?: ActivityRow[];
  loading?: boolean;
  loadError?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  perplConnected?: boolean;
  onConnectPerpl?: () => void;
  onKillSwitch?: () => void;
  onCopyTrader?: () => void;
  onMarkets?: () => void;
  onManageCopies?: () => void;
  onSeeActivity?: () => void;
};

export type MarketRow = {
  id: number;
  symbol: string;
  mark: string;
  changePct: number;
  volume: string;
};

export type MarketsProps = {
  markets?: MarketRow[];
  heldSymbols?: string[];
  search?: string;
  refreshToken?: number;
  onSearchChange?: (value: string) => void;
  onSelectMarket?: (id: number, symbol: string) => void;
};

export type PairDetailProps = {
  marketId?: number;
  refreshToken?: number;
  symbol?: string;
  mark?: string;
  changePct?: number;
  high?: string;
  low?: string;
  openInterest?: string;
  volume?: string;
  position?: PositionRow | null;
  onBack?: () => void;
  onCopyTrader?: () => void;
  onTrade?: (side: "long" | "short") => void;
};

export type TradeTicketProps = {
  symbol?: string;
  mark?: string;
  balance?: string;
  side?: "long" | "short";
  size?: string;
  leverage?: number;
  maxLeverage?: number;
  busy?: boolean;
  error?: { message: string } | null;
  notice?: string | null;
  onSideChange?: (side: "long" | "short") => void;
  onSizeChange?: (value: string) => void;
  onLeverageChange?: (value: number) => void;
  onSubmit?: () => void;
  onDryRun?: () => void;
  onBack?: () => void;
};

export type TradeFillRow = {
  id: string;
  market: string;
  side: "Long" | "Short";
  size: string;
  price: string;
  time: string;
  status: "Filled" | "Open" | "Partial" | "Cancelled";
  source: "Copy" | "Manual";
};

export type TradesProps = {
  fills?: TradeFillRow[];
  realizedPnlToday?: string;
  realizedPnlUp?: boolean;
  loading?: boolean;
  loadError?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onSelectFill?: (id: string) => void;
  onBack?: () => void;
};

export type LeaderRow = {
  id: string;
  handle: string;
  pnl30d: string;
  pnlUp: boolean;
  winRate: string;
  followers: string;
};

export type DiscoverProps = {
  leaders?: LeaderRow[];
  sort?: string;
  loading?: boolean;
  loadError?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onSortChange?: (sort: string) => void;
  onSelectTrader?: (id: string) => void;
};

export type TraderProfileProps = {
  handle?: string;
  bio?: string;
  pnl30d?: string;
  pnlUp?: boolean;
  pnl24h?: string;
  winRate?: string;
  sharpe?: string;
  followers?: string;
  following?: boolean;
  busy?: boolean;
  loading?: boolean;
  loadError?: string | null;
  positions?: PositionRow[];
  fills?: { market: string; side: string; price: string; time: string }[];
  allocation?: string;
  copyError?: string | null;
  onBack?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onAllocationChange?: (value: string) => void;
  onStartCopy?: () => void;
  onRetry?: () => void;
};

export type CopySettingRow = {
  leaderId: string;
  handle: string;
  allocation: string;
  status: "Active" | "Paused";
};

export type CopyManagementProps = {
  copies?: CopySettingRow[];
  loading?: boolean;
  loadError?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPause?: (leaderId: string) => void;
  onResume?: (leaderId: string) => void;
  onStop?: (leaderId: string) => void;
  onKillSwitch?: () => void;
  onBack?: () => void;
};

export type TournamentRow = {
  id: string;
  name: string;
  status: "Live" | "Upcoming" | "Ended";
  entrants: string;
  prize: string;
  rank?: string;
};

export type TournamentsProps = {
  tournaments?: TournamentRow[];
  joinedIds?: string[];
  joiningId?: string | null;
  loading?: boolean;
  loadError?: string | null;
  onJoin?: (id: string) => void;
  onSelect?: (id: string) => void;
  onRetry?: () => void;
};

export type AccountProps = {
  address?: string;
  handle?: string;
  connectedAt?: string;
  keyCount?: number;
  keys?: { id: string; label: string }[];
  revokingId?: string | null;
  perplStatus?: string;
  handleError?: string | null;
  savingHandle?: boolean;
  leaderProfile?: { isPublic: boolean; bio: string } | null;
  savingProfile?: boolean;
  profileError?: string | null;
  onConnectPerpl?: () => void;
  onLock?: () => void;
  onExport?: () => void;
  onSignOut?: () => void;
  onRevokeKey?: (id: string) => void;
  onEditProfile?: () => void;
  onSaveHandle?: (handle: string) => void;
  onWithdraw?: () => void;
  onSaveLeaderProfile?: (input: { isPublic: boolean; bio: string }) => void;
};