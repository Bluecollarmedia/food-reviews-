import { NextRequest, NextResponse } from "next/server";
import { recordVisit } from "@/lib/visitors";

// Best-effort client IP. On Netlify the real visitor IP is in
// x-nf-client-connection-ip; fall back to the standard proxy headers.
function clientIp(req: NextRequest): string {
  const h = req.headers;
  return (
    h.get("x-nf-client-connection-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    ""
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  let path = "/";
  try {
    const body = await req.json();
    if (typeof body?.path === "string") path = body.path;
  } catch {
    // no body / bad JSON — just log the visit with a default path
  }

  // The admin panel isn't a "visitor to the website" — don't log it.
  if (path.startsWith("/admin")) {
    return NextResponse.json({ ok: true });
  }

  await recordVisit(ip, path).catch(() => {});
  return NextResponse.json({ ok: true });
}
