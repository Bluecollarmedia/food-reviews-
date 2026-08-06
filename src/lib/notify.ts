import { createAdminClient } from "./supabase/admin";
import { sendEmail } from "./email";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function notifyByEmail({
  origin,
  slug,
  parentId,
  message,
  authorId,
}: {
  origin: string;
  slug: string;
  parentId: string | null;
  message: string;
  authorId: string | null;
}) {
  const supabase = createAdminClient();
  const preview = escapeHtml(message.slice(0, 140));
  const videoUrl = `${origin}/videos/${slug}`;

  const { data: adminSettings } = await supabase
    .from("admin_settings")
    .select("email_notifications, notify_email")
    .eq("id", 1)
    .single();

  if (adminSettings?.email_notifications && adminSettings.notify_email) {
    await sendEmail({
      to: adminSettings.notify_email,
      subject: parentId ? "New reply on D&S Food Reviews" : "New comment on D&S Food Reviews",
      html: `<p>${preview}</p><p><a href="${videoUrl}">View it</a></p>`,
    });
  }

  if (!parentId) return;

  const { data: parent } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", parentId)
    .single();

  const parentUserId = parent?.user_id;
  if (!parentUserId || parentUserId === authorId) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email_notifications")
    .eq("id", parentUserId)
    .single();

  if (!profile?.email_notifications) return;

  const { data: userResult } = await supabase.auth.admin.getUserById(parentUserId);
  const email = userResult?.user?.email;
  if (!email) return;

  await sendEmail({
    to: email,
    subject: "Someone replied to your comment",
    html: `<p>${preview}</p><p><a href="${videoUrl}">View the reply</a></p>`,
  });
}

export async function notifyNewAccount({ name, email }: { name: string; email: string }) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("notify_email")
    .eq("id", 1)
    .single();
  const to = data?.notify_email;
  if (!to) return;

  await sendEmail({
    to,
    subject: `New account request: ${name || email || "someone"}`,
    html: `
      <h2>New account awaiting approval</h2>
      <p><strong>Name:</strong> ${escapeHtml(name || "—")}</p>
      <p><strong>Email:</strong> ${escapeHtml(email || "—")}</p>
      <p>Review their profile picture and verification selfie, then Approve or Deny them in the admin panel &rarr; Accounts.</p>
    `,
  });
}

export async function notifyNewUpload({
  origin,
  slug,
  title,
}: {
  origin: string;
  slug: string;
  title: string;
}) {
  const supabase = createAdminClient();
  const videoUrl = `${origin}/videos/${slug}`;

  const { data: subscribers } = await supabase
    .from("profiles")
    .select("id")
    .eq("new_upload_notifications", true);

  if (!subscribers || subscribers.length === 0) return;

  await Promise.all(
    subscribers.map(async ({ id }) => {
      const { data: userResult } = await supabase.auth.admin.getUserById(id);
      const email = userResult?.user?.email;
      if (!email) return;

      await sendEmail({
        to: email,
        subject: `New review: ${title}`,
        html: `<p>A new review just went up: <strong>${escapeHtml(title)}</strong></p><p><a href="${videoUrl}">Watch it</a></p>`,
      });
    })
  );
}
