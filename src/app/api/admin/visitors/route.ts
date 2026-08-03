import { NextRequest, NextResponse } from "next/server";
import { hideIp, unhideIp, setLabel, clearVisitor } from "@/lib/visitors";
import { banIp, unbanIp, setBanMessage } from "@/lib/bans";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { action?: string; ip?: string; label?: string; message?: string }
    | null;

  if (!body || !body.action) {
    return NextResponse.json({ error: "Missing action." }, { status: 400 });
  }

  // The ban message isn't tied to a specific IP.
  if (body.action === "ban-message") {
    await setBanMessage(body.message ?? "");
    return NextResponse.json({ ok: true });
  }

  if (!body.ip) {
    return NextResponse.json({ error: "Missing ip." }, { status: 400 });
  }

  switch (body.action) {
    case "hide":
      await hideIp(body.ip);
      break;
    case "unhide":
      await unhideIp(body.ip);
      break;
    case "label":
      await setLabel(body.ip, body.label ?? "");
      break;
    case "clear":
      await clearVisitor(body.ip);
      break;
    case "ban":
      await banIp(body.ip);
      break;
    case "unban":
      await unbanIp(body.ip);
      break;
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
