export type Comment = {
  id: string;
  message: string;
  createdAt: string;
  authorName: string;
  avatarUrl: string | null;
  imageUrl: string | null;
  isGuest: boolean;
  userId: string | null;
  replies: Comment[];
};

export type Reviewer = string;
export type ReviewStatus = "published" | "draft" | "locked" | "vault";

export type Review = {
  slug: string;
  title: string;
  categories: string[];
  store: string;
  city: string;
  rating: number;
  price?: string;
  description: string;
  reviewer: Reviewer;
  status: ReviewStatus;
  videoKey?: string;
  thumbnailKey?: string;
  /** If set, a second person also reviewed this same video (any name — David, Shmuel, or a guest). */
  secondReviewer?: string;
  secondReviewerVideoKey?: string;
  secondReviewerThumbnailKey?: string;
  secondReviewerRating?: number;
  createdAt: string;
  updatedAt: string;
  /** Public-facing padded view count, attached when the review is read. */
  displayViews?: number;
};

export const categories = [
  "Pizza",
  "Dairy",
  "Meat",
  "Desserts",
  "Drinks",
] as const;

export const cities = ["Lakewood", "Toms River", "Deal", "Brooklyn"] as const;

export const reviewers: Reviewer[] = ["David", "Shmuel"];

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
