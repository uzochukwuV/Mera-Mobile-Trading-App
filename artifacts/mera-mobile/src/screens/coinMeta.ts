// Coin display metadata shared by the tab screens.
const COIN_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#9945FF",
  SHIB: "#E8734A",
  XRP: "#2A3446",
  USDT: "#26A17B",
  DOGE: "#C2A633",
  MON: "#8A63D2",
  ZEC: "#EAB308",
  NEAR: "#00C08B",
  PUMP: "#65A30D",
};

const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  SHIB: "Shiba Inu",
  XRP: "Ripple",
  USDT: "Tether",
  DOGE: "Dogecoin",
  MON: "Monad",
  ZEC: "Zcash",
  NEAR: "Near",
  PUMP: "Pump",
};

const AVATAR_TINTS = [
  { bg: "#EAF3C4", fg: "#4D7C0F" },
  { bg: "#E0E9FF", fg: "#1D4ED8" },
  { bg: "#FFE8D6", fg: "#B45309" },
  { bg: "#E8E4FF", fg: "#6D28D9" },
] as const;

function coinColor(symbol: string): string {
  return COIN_COLORS[symbol.trim().toUpperCase()] ?? "#2A3446";
}

function coinName(symbol: string): string {
  return COIN_NAMES[symbol.trim().toUpperCase()] ?? symbol.trim().toUpperCase();
}

/** Deterministic tinted avatar for names without a brand color. */
function tintForName(name: string): { bg: string; fg: string } {
  const key = name.trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) % 997;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

export { coinColor, coinName, tintForName };
