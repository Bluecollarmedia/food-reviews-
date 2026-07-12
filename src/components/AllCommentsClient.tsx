"use client";

import { useEffect } from "react";
import { useComments } from "@/lib/use-comments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

export default function AllCommentsClient({ slug }: { slug: string }) {
  const { comments, refresh } = useComments(slug);

  useEffect(() => {
    if (!comments || !window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("bg-primary/10");
    const timeout = setTimeout(() => target.classList.remove("bg-primary/10"), 2500);
    return () => clearTimeout(timeout);
  }, [comments]);

  return (
    <div>
      <CommentForm slug={slug} onPosted={refresh} />
      <CommentList comments={comments} slug={slug} onChanged={refresh} />
    </div>
  );
}
