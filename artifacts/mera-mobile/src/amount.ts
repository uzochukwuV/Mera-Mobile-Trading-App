// Amounts typed by people, not parsed by machines.
//
// `Number("0,001")` is NaN. Android's decimal keypad inserts the device
// locale's separator, so on a comma-locale phone the ticket displayed
// "0,001" — a value that looked entered — while the notional read "—"
// and submit answered "Enter an amount greater than zero". Both
// separators are accepted, and the field is rewritten to a dot so what
// it shows is exactly what will be sent.

/** Rewrites typed text to a canonical `digits.digits` amount. */
export function normalizeAmountInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.,]/g, "").replace(/,/g, ".");
  const dot = cleaned.indexOf(".");
  const amount =
    dot === -1
      ? cleaned
      : `${cleaned.slice(0, dot)}.${cleaned.slice(dot + 1).replace(/\./g, "")}`;
  // A leading separator is a real value (".5"), but show it the way a
  // price would be written ("0.5").
  return amount.startsWith(".") ? `0${amount}` : amount;
}

/** Reads a typed amount. Returns NaN when there is no number to read. */
export function parseAmount(raw: string): number {
  const cleaned = normalizeAmountInput(raw).replace(/\.$/, "");
  if (cleaned === "") return Number.NaN;
  return Number(cleaned);
}
