// Supabase auth errors usually carry a readable `.message`, but a rate-limited
// or failed request can come back with an empty body that serializes to "{}"
// (or nothing at all). Rather than render that raw to the user, fall back to a
// plain-English message so the form never shows a bare "{}".
export function authErrorMessage(message: string | undefined | null): string {
  const cleaned = (message ?? "").trim();
  if (!cleaned || cleaned === "{}" || cleaned === "[object Object]") {
    return "Something went wrong — please try again in a minute.";
  }
  return cleaned;
}
