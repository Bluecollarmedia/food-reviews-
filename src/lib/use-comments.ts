"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "./supabase/client";
import { getPublicFileUrl } from "./media-url";
import type { Comment } from "./data";

type Row = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  message: string;
  parent_id: string | null;
  created_at: string;
  profiles: { display_name: string; avatar_key: string | null } | null;
};

function toComment(row: Row): Comment {
  return {
    id: row.id,
    message: row.message,
    createdAt: row.created_at,
    authorName: row.profiles?.display_name ?? row.guest_name ?? "Guest",
    avatarUrl: getPublicFileUrl(row.profiles?.avatar_key),
    isGuest: row.user_id === null,
    userId: row.user_id,
    replies: [],
  };
}

function buildTree(rows: Row[]): Comment[] {
  const byId = new Map<string, Comment>();
  rows.forEach((r) => byId.set(r.id, toComment(r)));

  const roots: Comment[] = [];
  rows.forEach((r) => {
    const comment = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id)!.replies.push(comment);
    } else if (!r.parent_id) {
      roots.push(comment);
    }
  });

  return roots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function useComments(slug: string) {
  const [comments, setComments] = useState<Comment[] | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select(
        "id, user_id, guest_name, message, parent_id, created_at, profiles(display_name, avatar_key)"
      )
      .eq("slug", slug)
      .order("created_at", { ascending: true });
    setComments(buildTree((data as unknown as Row[]) ?? []));
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    refresh().catch(() => {
      if (!cancelled) setComments([]);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { comments, refresh };
}
