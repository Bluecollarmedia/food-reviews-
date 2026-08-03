import { unstable_cache } from "next/cache";
import { createAdminClient } from "./supabase/admin";

export const SITE_SETTINGS_TAG = "site-settings";

export type Banner = {
  message: string;
  /** Changes only when the message text changes, so a dismissal sticks. */
  version: string;
};

/**
 * The public announcement banner, or null if none is active. Cached (with a
 * tag the admin settings save busts) so it isn't a database hit on every page
 * view, while still updating within seconds of a change.
 */
export const getActiveBanner = unstable_cache(
  async (): Promise<Banner | null> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("banner_message, banner_expires_at, banner_updated_at")
      .eq("id", 1)
      .single();

    const message = data?.banner_message?.trim();
    if (!message) return null;
    if (data?.banner_expires_at && new Date(data.banner_expires_at).getTime() < Date.now()) {
      return null;
    }
    return { message, version: data?.banner_updated_at ?? message };
  },
  ["active-banner"],
  { revalidate: 30, tags: [SITE_SETTINGS_TAG] }
);

export type SiteLockMode = "off" | "full" | "code";

/** Read the site-lock mode for the lock screen itself (server components). */
export async function getSiteLockMode(): Promise<SiteLockMode> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("site_lock_mode")
    .eq("id", 1)
    .single();
  const mode = data?.site_lock_mode;
  return mode === "full" || mode === "code" ? mode : "off";
}

export async function getSiteLockPasscode(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("site_lock_passcode")
    .eq("id", 1)
    .single();
  return data?.site_lock_passcode || "";
}
