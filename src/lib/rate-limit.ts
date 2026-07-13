import { getStore } from "@netlify/blobs";
import type { NextRequest } from "next/server";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

type Record = { count: number; firstAttemptAt: number };

function rateLimitStore() {
  // Attempts are read-then-written on every request in quick succession, so
  // the default eventual consistency can miss the previous write and let
  // the count appear to never climb — force strong consistency instead.
  return getStore("rate-limits", { consistency: "strong" });
}

export function getClientIp(req: NextRequest): string {
  const nfIp = req.headers.get("x-nf-client-connection-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = nfIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
  // TEMP DIAGNOSTIC: remove once we confirm the rate limiter keys correctly.
  console.log("[rate-limit] getClientIp", { nfIp, forwardedFor, resolved: ip });
  return ip;
}

export async function checkRateLimit(
  key: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const store = rateLimitStore();
    const record = (await store.get(key, { type: "json" })) as Record | null;
    const now = Date.now();

    // TEMP DIAGNOSTIC: remove once we confirm the rate limiter keys correctly.
    console.log("[rate-limit] checkRateLimit", { key, record, now });

    if (record && now - record.firstAttemptAt < WINDOW_MS && record.count >= MAX_ATTEMPTS) {
      const retryAfterSeconds = Math.ceil((record.firstAttemptAt + WINDOW_MS - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[rate-limit] checkRateLimit FAILED, allowing request through", err);
    return { allowed: true };
  }
}

export async function recordFailedAttempt(key: string): Promise<void> {
  try {
    const store = rateLimitStore();
    const now = Date.now();
    const record = (await store.get(key, { type: "json" })) as Record | null;

    const next =
      record && now - record.firstAttemptAt < WINDOW_MS
        ? { count: record.count + 1, firstAttemptAt: record.firstAttemptAt }
        : { count: 1, firstAttemptAt: now };

    // TEMP DIAGNOSTIC: remove once we confirm the rate limiter keys correctly.
    console.log("[rate-limit] recordFailedAttempt", { key, before: record, after: next });

    await store.setJSON(key, next);
  } catch (err) {
    console.error("[rate-limit] recordFailedAttempt FAILED to persist", err);
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  await rateLimitStore().delete(key);
}
