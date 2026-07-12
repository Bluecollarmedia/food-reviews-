export type Comment = {
  id: string;
  name: string;
  message: string;
  timeAgo: string;
};

export type Reviewer = string;
export type ReviewStatus = "published" | "draft" | "locked";

export type Review = {
  slug: string;
  title: string;
  categories: string[];
  store: string;
  city: string;
  rating: number;
  price?: "$" | "$$" | "$$$";
  description: string;
  reviewer: Reviewer;
  status: ReviewStatus;
  videoKey?: string;
  thumbnailKey?: string;
  shmuelVideoKey?: string;
  shmuelThumbnailKey?: string;
  shmuelRating?: number;
  createdAt: string;
  updatedAt: string;
};

export const categories = [
  "Pizza",
  "Dairy",
  "Meat",
  "Fast Food",
  "Desserts",
  "Drinks",
] as const;

export const cities = ["Lakewood", "Toms River", "Deal", "Brooklyn"] as const;

export const reviewers: Reviewer[] = ["David", "Shmuel", "David & Shmuel"];

export const prices = ["$", "$$", "$$$"] as const;

export function getRelatedReviews(review: Review, pool: Review[], limit = 8) {
  const scored = pool
    .filter((r) => r.slug !== review.slug)
    .map((r) => ({
      review: r,
      score:
        r.categories.filter((c) => review.categories.includes(c)).length +
        (r.city === review.city ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.review);
}
