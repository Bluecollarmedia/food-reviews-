import { NextRequest, NextResponse } from "next/server";
import { redeemUnbanPin } from "@/lib/appeals";
import { unbanIp } from "@/lib/bans";
import { getClientIp, checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";

const PIN_LIMIT = { maxAttempts: 8, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const key = `unban-pin:${getClientIp(req)}`;
  const { allowed } = await checkRateLimit(key, PIN_LIMIT);
  if (!allowed) {
    return NextResponse.json({ error: "Too many tries. Wait a bit." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { pin?: string } | null;
  const pin = (body?.pin ?? "").trim();
  if (!/^\d{4,8}$/.test(pin)) {
    await recordFailedAttempt(key, PIN_LIMIT);
    return NextResponse.json({ error: "Enter the numeric code." }, { status: 400 });
  }

  const redeemed = await redeemUnbanPin(pin);
  if (!redeemed) {
    await recordFailedAttempt(key, PIN_LIMIT);
    return NextResponse.json({ error: "That code is wrong or expired." }, { status: 401 });
  }

  // Lift the ban on the device and all of its IPs.
  const targets = [redeemed.deviceId, ...redeemed.ips].filter(Boolean);
  for (const t of [...new Set(targets)]) await unbanIp(t);

  return NextResponse.json({ ok: true });
}
