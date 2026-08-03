import { NextRequest, NextResponse } from "next/server";
import { setViewOverride, clearViewOverride } from "@/lib/view-counts";

// Set or clear the public-facing (padded) view count for a review. The real
// view count is never touched — this only changes what visitors see.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { slug?: string; value?: number | null }
    | null;

  if (!body || !body.slug) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  if (body.value === null || body.value === undefined) {
    await clearViewOverride(body.slug);
    return NextResponse.json({ ok: true, override: null });
  }

  const value = Number(body.value);
  if (!Number.isFinite(value) || value < 0) {
    return NextResponse.json({ error: "Enter a valid number." }, { status: 400 });
  }

  await setViewOverride(body.slug, value);
  return NextResponse.json({ ok: true, override: Math.round(value) });
}
