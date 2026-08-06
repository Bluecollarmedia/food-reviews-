import { NextRequest, NextResponse } from "next/server";
import {
  hideVisitor,
  unhideVisitor,
  setLabel,
  clearVisitor,
  clearAllVisitors,
} from "@/lib/visitors";
import { banIp, unbanIp, setBanMessage } from "@/lib/bans";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { action?: string; id?: string; ip?: string; label?: string; message?: string }
    | null;

  if (!body || !body.action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  switch (body.action) {
    // Site-wide, not tied to a specific visitor.
    case "ban-message":
      await setBanMessage(body.message ?? "");
      return NextResponse.json({ ok: true });
    case "clear-all":
      await clearAllVisitors();
      return NextResponse.json({ ok: true });

    // Device-level actions.
    case "hide":
    case "unhide":
    case "label":
    case "clear": {
      if (!body.id) {
        return NextResponse.json({ error: "Missing id." }, { status: 400 });
      }
      if (body.action === "hide") await hideVisitor(body.id);
      else if (body.action === "unhide") await unhideVisitor(body.id);
      else if (body.action === "label") await setLabel(body.id, body.label ?? "");
      else await clearVisitor(body.id);
      return NextResponse.json({ ok: true });
    }

    // Bans: block the DEVICE id (reliable across IP changes) and its current IP
    // as a fallback. The middleware checks both.
    case "ban":
    case "unban": {
      if (!body.id && !body.ip) {
        return NextResponse.json({ error: "Missing id or ip." }, { status: 400 });
      }
      const fn = body.action === "ban" ? banIp : unbanIp;
      if (body.id) await fn(body.id);
      if (body.ip) await fn(body.ip);
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
