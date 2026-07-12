"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { getPublicFileUrl } from "./media-url";

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUser(data.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      setAvatarUrl(null);
      return;
    }
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("profiles")
      .select("display_name, avatar_key")
      .eq("id", user.id)
      .single()
      .then(
        ({ data }: { data: { display_name: string; avatar_key: string | null } | null }) => {
          if (cancelled) return;
          setDisplayName(data?.display_name ?? null);
          setAvatarUrl(getPublicFileUrl(data?.avatar_key));
        }
      );
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { user, displayName, avatarUrl, loading: user === undefined };
}
