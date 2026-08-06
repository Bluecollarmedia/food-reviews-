import { NextRequest, NextResponse } from "next/server";
import { createAppeal } from "@/lib/appeals";
import { putObject } from "@/lib/r2";
import { getPublicFileUrl } from "@/lib/media-url";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, checkRateLimit, recordFailedAttempt } from "@/lib/rate-limit";
import type { VisitorGeo } from "@/lib/visitors";

const APPEAL_LIMIT = { maxAttempts: 5, windowMs: 60 * 60 * 1000 }; // 5 per hour per IP

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function lookupGeo(ip: string): Promise<VisitorGeo | undefined> {
  if (!ip) return undefined;
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return undefined;
    const d = await r.json();
    if (!d || d.success === false) return undefined;
    return {
      city: d.city, region: d.region, country: d.country, countryCode: d.country_code,
      isp: d.connection?.isp, org: d.connection?.org, lat: d.latitude, lon: d.longitude,
      timezone: d.timezone?.id, flag: d.flag?.emoji,
    };
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  const serverIp = getClientIp(req);
  const key = `appeal:${serverIp}`;
  const { allowed } = await checkRateLimit(key, APPEAL_LIMIT);
  if (!allowed) {
    return NextResponse.json({ error: "Too many appeals. Try again later." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | { name?: string; contact?: string; message?: string; selfie?: string; deviceId?: string; ip?: string; faceVerified?: boolean }
    | null;

  const name = (body?.name ?? "").trim().slice(0, 120);
  const contact = (body?.contact ?? "").trim().slice(0, 200);
  const message = (body?.message ?? "").trim().slice(0, 2000);
  const deviceId = (body?.deviceId ?? "").trim().slice(0, 64);
  const reportedIp = (body?.ip ?? "").trim();
  const ip = /^[0-9a-fA-F.:]{3,}$/.test(reportedIp) ? reportedIp : serverIp;

  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  await recordFailedAttempt(key, APPEAL_LIMIT);

  // Save the live selfie (a data URL) to R2.
  let selfieKey: string | undefined;
  const selfie = body?.selfie ?? "";
  const m = selfie.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (m) {
    try {
      const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (bytes.length <= 6_000_000) {
        selfieKey = `appeals/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        await putObject(selfieKey, bytes, m[1]);
      }
    } catch {
      selfieKey = undefined;
    }
  }

  const geo = await lookupGeo(ip);

  const appeal = await createAppeal({
    name,
    contact,
    message,
    selfieKey,
    faceVerified: body?.faceVerified === true,
    deviceId,
    ips: ip ? [ip] : [],
    ip,
    geo,
  });

  // Email it to the owner (best-effort; only sends if Resend is configured).
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("notify_email")
      .eq("id", 1)
      .single();
    const to = data?.notify_email;
    if (to) {
      const selfieUrl = selfieKey ? getPublicFileUrl(selfieKey) : null;
      const place = geo ? [geo.city, geo.region, geo.country].filter(Boolean).join(", ") : "";
      await sendEmail({
        to,
        subject: `Ban appeal from ${name}`,
        html: `
          <h2>Ban appeal</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Contact:</strong> ${escapeHtml(contact) || "—"}</p>
          <p><strong>Message:</strong><br>${escapeHtml(message) || "—"}</p>
          <p><strong>Where:</strong> ${escapeHtml(place) || "unknown"} · ${escapeHtml(ip)}</p>
          <p><strong>Face scan passed:</strong> ${appeal.faceVerified ? "yes" : "no"}</p>
          ${selfieUrl ? `<p><img src="${selfieUrl}" alt="selfie" width="240" /></p>` : ""}
          <p>Review it in the admin panel &rarr; Appeals.</p>
        `,
      });
    }
  } catch {
    // email is best-effort
  }

  return NextResponse.json({ ok: true, id: appeal.id });
}
