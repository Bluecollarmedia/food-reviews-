"use client";

import { useComments } from "@/lib/use-comments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

export default function AllCommentsClient({ slug }: { slug: string }) {
  const { comments, setComments } = useComments(slug);

  return (
    <div>
      <CommentForm slug={slug} onPosted={setComments} />
      <CommentList comments={comments} />
    </div>
  );
}
