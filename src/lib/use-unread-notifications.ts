"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";

export function useUnreadNotificationCount(user: User | null | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    const supabase = createClient();
    let cancelled = false;
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count }: { count: number | null }) => {
        if (!cancelled) setCount(count ?? 0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return count;
}
