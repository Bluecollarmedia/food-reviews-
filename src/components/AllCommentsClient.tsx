"use client";

import { useComments } from "@/lib/use-comments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

export default function AllCommentsClient({ slug }: { slug: string }) {
  const { comments, refresh } = useComments(slug);

  return (
    <div>
      <CommentForm slug={slug} onPosted={refresh} />
      <CommentList comments={comments} slug={slug} onChanged={refresh} />
    </div>
  );
}
