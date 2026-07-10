import { getStore } from "@netlify/blobs";
import type { Comment } from "./data";

type StoredComment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

function relativeTime(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function commentsStore() {
  return getStore("comments");
}

export async function getComments(slug: string): Promise<Comment[]> {
  const stored = (await commentsStore().get(slug, { type: "json" })) as StoredComment[] | null;
  const list = stored ?? [];
  return list
    .slice()
    .reverse()
    .map((c) => ({ id: c.id, name: c.name, message: c.message, timeAgo: relativeTime(c.createdAt) }));
}

export async function addComment(slug: string, name: string, message: string): Promise<Comment[]> {
  const stored = (await commentsStore().get(slug, { type: "json" })) as StoredComment[] | null;
  const list = stored ?? [];
  const entry: StoredComment = {
    id: crypto.randomUUID(),
    name: name.slice(0, 60),
    message: message.slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  await commentsStore().setJSON(slug, [...list, entry]);
  return getComments(slug);
}

export async function deleteComment(slug: string, commentId: string): Promise<Comment[]> {
  const stored = (await commentsStore().get(slug, { type: "json" })) as StoredComment[] | null;
  const list = (stored ?? []).filter((c) => c.id !== commentId);
  await commentsStore().setJSON(slug, list);
  return getComments(slug);
}
