import { NextRequest, NextResponse } from "next/server";
import { hideIp, unhideIp, setLabel, clearVisitor } from "@/lib/visitors";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { action?: string; ip?: string; label?: string }
    | null;

  if (!body || !body.ip || !body.action) {
    return NextResponse.json({ error: "Missing action or ip." }, { status: 400 });
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
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
