"use client";

import { useEffect, useState } from "react";
import type { Comment } from "./data";

export function useComments(slug: string) {
  const [comments, setComments] = useState<Comment[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/comments/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setComments(data.comments ?? []);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { comments, setComments };
}
