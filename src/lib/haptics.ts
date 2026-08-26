// Lightweight haptic feedback for the installed app. Uses the Web Vibration
// API, which works in an installed PWA / Android WebView wrapper. A no-op where
// unsupported (desktop, iOS Safari), so it's always safe to call.
type HapticKind = "light" | "medium" | "heavy" | "success";

const PATTERNS: Record<HapticKind, number | number[]> = {
  light: 8,
  medium: 18,
  heavy: 32,
  success: [12, 40, 12],
};

export function haptic(kind: HapticKind = "light") {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(PATTERNS[kind]);
    }
  } catch {
    // ignore — haptics are a nice-to-have
  }
}
