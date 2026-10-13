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
  address?: string;
  step?: 1 | 2 | 3;
  error?: { code?: string; message: string } | null;
  busy?: boolean;
  onEnroll?: () => void;
  onImport?: () => void;
  onGoFund?: () => void;
  onRetry?: () => void;
  onBack?: () => void;
};

export type FundProps = {
  available?: string;
  locked?: string;
  equity?: string;
  progress?: number; // 0..1 toward the minimum
  meetsMinimum?: boolean;
  remaining?: string;
  onOpenFaucet?: () => void;
  onDeposited?: () => void;
  onWithdraw?: () => void;
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
  search?: string;
  onSearchChange?: (value: string) => void;
  onSelectMarket?: (id: number) => void;
};

export type PairDetailProps = {
  symbol?: string;
  mark?: string;
  changePct?: number;
  high?: string;
  low?: string;
  funding?: string;
  openInterest?: string;
  volume?: string;
  position?: PositionRow | null;
  onBack?: () => void;
  onCopyTrader?: () => void;
  onTrade?: () => void;
};

export type TradeTicketProps = {
  symbol?: string;
  mark?: string;
  side?: "long" | "short";
  size?: string;
  leverage?: number;
  maxLeverage?: number;
  busy?: boolean;
  error?: { message: string } | null;
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
  onSortChange?: (sort: string) => void;
  onSelectTrader?: (id: string) => void;
};

export type TraderProfileProps = {
  handle?: string;
  bio?: string;
  pnl30d?: string;
  pnlUp?: boolean;
  winRate?: string;
  sharpe?: string;
  followers?: string;
  following?: boolean;
  busy?: boolean;
  positions?: PositionRow[];
  allocation?: string;
  onBack?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onAllocationChange?: (value: string) => void;
  onStartCopy?: () => void;
};

export type CopySettingRow = {
  leaderId: string;
  handle: string;
  allocation: string;
  status: "Active" | "Paused";
};

export type CopyManagementProps = {
  copies?: CopySettingRow[];
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
  onJoin?: (id: string) => void;
  onSelect?: (id: string) => void;
};

export type AccountProps = {
  address?: string;
  handle?: string;
  connectedAt?: string;
  keyCount?: number;
  onLock?: () => void;
  onExport?: () => void;
  onSignOut?: () => void;
  onRevokeKey?: () => void;
  onEditProfile?: () => void;
};