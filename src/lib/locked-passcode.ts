import { createAdminClient } from "./supabase/admin";

export async function getLockedPasscode(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("locked_passcode")
    .eq("id", 1)
    .single();

  return data?.locked_passcode || process.env.LOCKED_PASSCODE || "";
}

export async function getVaultPasscode(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("locked_passcode_2")
    .eq("id", 1)
    .single();

  return data?.locked_passcode_2 || process.env.VAULT_PASSCODE || "";
}

/** Gates the Locked/Vault passcode fields inside Admin Settings. Empty means
 *  never configured yet — treated as "not gated yet" so the owner can set it
 *  for the first time without being locked out of setting it. */
export async function getSettingsPasscode(): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_settings")
    .select("settings_passcode")
    .eq("id", 1)
    .single();

  return data?.settings_passcode || process.env.SETTINGS_PASSCODE || "";
}
