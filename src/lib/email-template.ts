// Shared, email-client-safe HTML (tables + inline styles) so every email from
// the site looks consistent and branded.

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const RED = "#c8102e";
const CREAM = "#fbf6ef";
const INK = "#221d19";
const MUTED = "#6b625a";
const BORDER = "#e7dcc9";

/** Wrap inner content in the branded shell (header bar + footer). */
export function emailShell(innerHtml: string): string {
  return `
  <div style="margin:0;padding:24px 12px;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:${RED};padding:18px 24px;">
          <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.5px;">D&amp;S FOOD REVIEWS</span>
        </td>
      </tr>
      <tr><td style="padding:24px;">${innerHtml}</td></tr>
      <tr>
        <td style="padding:16px 24px;border-top:1px solid ${BORDER};">
          <p style="margin:0;color:${MUTED};font-size:12px;">Honest, brutal, non-biased reviews on food.</p>
        </td>
      </tr>
    </table>
  </div>`;
}

/** A branded button. */
function button(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background:${RED};color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 28px;border-radius:999px;">${escapeHtml(label)}</a>`;
}

/** "New review published" email with the thumbnail. */
export function reviewEmail(opts: {
  title: string;
  store?: string;
  city?: string;
  rating?: number | null;
  thumbnailUrl?: string | null;
  videoUrl: string;
  forOwner: boolean;
}): string {
  const { title, store, city, rating, thumbnailUrl, videoUrl, forOwner } = opts;
  const place = [store, city].filter(Boolean).map((s) => escapeHtml(String(s))).join(" · ");

  const thumb = thumbnailUrl
    ? `<a href="${videoUrl}"><img src="${thumbnailUrl}" alt="${escapeHtml(title)}" width="472" style="display:block;width:100%;max-width:472px;height:auto;border-radius:12px;border:1px solid ${BORDER};margin-bottom:18px;" /></a>`
    : "";

  const ratingBadge =
    typeof rating === "number"
      ? `<span style="display:inline-block;background:${RED};color:#ffffff;font-size:13px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:10px;">★ ${escapeHtml(String(rating))}</span><br/>`
      : "";

  const intro = forOwner
    ? `<p style="margin:0 0 14px;color:${MUTED};font-size:14px;">Your new review is now live. 🎉</p>`
    : `<p style="margin:0 0 14px;color:${MUTED};font-size:14px;">A new review just dropped.</p>`;

  return emailShell(`
    ${thumb}
    ${intro}
    ${ratingBadge}
    <h1 style="margin:0 0 6px;color:${INK};font-size:22px;font-weight:800;">${escapeHtml(title)}</h1>
    ${place ? `<p style="margin:0 0 20px;color:${MUTED};font-size:14px;">${place}</p>` : `<div style="height:8px;"></div>`}
    ${button(videoUrl, "Watch it")}
  `);
}
