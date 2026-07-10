import { getStore } from "@netlify/blobs";

export type Reactions = { likes: number; dislikes: number };

function reactionsStore() {
  return getStore("reactions");
}

export async function getReactions(slug: string): Promise<Reactions> {
  const stored = (await reactionsStore().get(slug, { type: "json" })) as Reactions | null;
  return stored ?? { likes: 0, dislikes: 0 };
}

export async function adjustReaction(
  slug: string,
  type: "like" | "dislike",
  delta: 1 | -1
): Promise<Reactions> {
  const current = await getReactions(slug);
  const updated: Reactions = {
    likes: type === "like" ? Math.max(0, current.likes + delta) : current.likes,
    dislikes: type === "dislike" ? Math.max(0, current.dislikes + delta) : current.dislikes,
  };
  await reactionsStore().setJSON(slug, updated);
  return updated;
}
