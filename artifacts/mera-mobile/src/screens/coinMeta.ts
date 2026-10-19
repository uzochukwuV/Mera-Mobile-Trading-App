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

// A generated avatar knows nothing about the name it stands for, so it
// has nothing to say with a hue — and the system spends its one accent
// on actions. The hash still picks a tone, which is enough to tell two
// rows apart without inventing a colour for each trader.
const AVATAR_TINTS = [
  { bg: "#F4F2F0", fg: "#0C0A08" },
  { bg: "#EAE7E4", fg: "#0C0A08" },
  { bg: "#E3DFDB", fg: "#0C0A08" },
  { bg: "#F8F6F4", fg: "#0C0A08" },
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
