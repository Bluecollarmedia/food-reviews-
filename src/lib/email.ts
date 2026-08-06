export type SendEmailResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY is not set on the server." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "D&S Food Reviews <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      let detail = `Resend returned ${res.status}.`;
      try {
        const body = await res.json();
        if (body?.message) detail = body.message;
      } catch {
        // keep the status-based message
      }
      return { ok: false, error: detail };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error contacting Resend." };
  }
}
