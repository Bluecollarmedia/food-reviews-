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
  return (
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function checkRateLimit(
  key: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const store = rateLimitStore();
  const record = (await store.get(key, { type: "json" })) as Record | null;
  const now = Date.now();

  if (record && now - record.firstAttemptAt < WINDOW_MS && record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttemptAt + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}

export async function recordFailedAttempt(key: string): Promise<void> {
  const store = rateLimitStore();
  const now = Date.now();
  const record = (await store.get(key, { type: "json" })) as Record | null;

  if (record && now - record.firstAttemptAt < WINDOW_MS) {
    await store.setJSON(key, { count: record.count + 1, firstAttemptAt: record.firstAttemptAt });
  } else {
    await store.setJSON(key, { count: 1, firstAttemptAt: now });
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  await rateLimitStore().delete(key);
}
