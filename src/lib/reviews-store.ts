import { getStore } from "@netlify/blobs";
import type { Review, ReviewStatus, Reviewer } from "./data";

function reviewsStore() {
  return getStore("reviews");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const SEED_REVIEWS: Review[] = [
  {
    slug: "downtown-pepperoni-slice",
    title: "This Pizza Almost Made Us Fight",
    categories: ["Pizza", "Dairy"],
    store: "Tony's Slice House",
    city: "Lakewood",
    rating: 9,
    price: "$",
    description:
      "A thin-crust pepperoni slice that split the room. David loved the crispy edge, Shmuel thought the sauce was way too sweet. We argue it out and give our honest, brutal verdict.",
    reviewer: "David & Shmuel",
    status: "published",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    slug: "double-smash-burger",
    title: "Double Smash Burger Showdown",
    categories: ["Fast Food", "Meat"],
    store: "Grease & Griddle",
    city: "Toms River",
    rating: 8,
    price: "$$",
    description:
      "Crispy lace edges, but is it worth the price? We break down the bun-to-patty ratio and don't hold back on the value verdict.",
    reviewer: "David",
    status: "published",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    slug: "street-cart-al-pastor",
    title: "Street Cart Al Pastor - Hidden Gem?",
    categories: ["Fast Food", "Meat"],
    store: "El Trompo Cart",
    city: "Lakewood",
    rating: 9.5,
    description:
      "No seating, no menu, just a spinning trompo and pure flavor. This might be the highest score we've ever given.",
    reviewer: "Shmuel",
    status: "published",
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  },
  {
    slug: "nashville-hot-wings",
    title: "Nashville Hot Wings Nearly Broke Us",
    categories: ["Fast Food", "Meat"],
    store: "Firehouse Wing Co.",
    city: "Toms River",
    rating: 7,
    price: "$$",
    description:
      "Heat that's more pain than flavor past level 3. We rank every heat level so you know exactly what you're walking into.",
    reviewer: "David & Shmuel",
    status: "published",
    createdAt: "2026-01-04T00:00:00.000Z",
    updatedAt: "2026-01-04T00:00:00.000Z",
  },
  {
    slug: "omakase-on-a-budget",
    title: "Omakase On a Budget - Worth It?",
    categories: ["Fast Food"],
    store: "Sato's Counter",
    city: "Lakewood",
    rating: 9,
    price: "$$$",
    description:
      "Twelve pieces, one chef, zero pretension. We compare it against the fancy uptown spot and the results surprised us.",
    reviewer: "David",
    status: "published",
    createdAt: "2026-01-05T00:00:00.000Z",
    updatedAt: "2026-01-05T00:00:00.000Z",
  },
  {
    slug: "backyard-brisket",
    title: "12-Hour Brisket That Made Shmuel Cry",
    categories: ["Fast Food", "Meat"],
    store: "Smoke Ring BBQ",
    city: "Toms River",
    rating: 9.5,
    price: "$$",
    description:
      "Bark, smoke ring, and a texture that shouldn't be legal. This is the review that made us BBQ believers.",
    reviewer: "David & Shmuel",
    status: "published",
    createdAt: "2026-01-06T00:00:00.000Z",
    updatedAt: "2026-01-06T00:00:00.000Z",
  },
  {
    slug: "mall-food-court-cheesecake",
    title: "We Tried Mall Food Court Cheesecake",
    categories: ["Desserts", "Dairy"],
    store: "Food Court Bakery Stand",
    city: "Lakewood",
    rating: 5,
    price: "$",
    description:
      "Low expectations, even lower results. A brutally honest breakdown of why mall dessert stands live and die on frosting alone.",
    reviewer: "Shmuel",
    status: "published",
    createdAt: "2026-01-07T00:00:00.000Z",
    updatedAt: "2026-01-07T00:00:00.000Z",
  },
  {
    slug: "detroit-style-deep-dish",
    title: "Detroit-Style Deep Dish, Explained",
    categories: ["Pizza", "Dairy"],
    store: "Motor City Pie Co.",
    city: "Toms River",
    rating: 8,
    price: "$$",
    description:
      "Caramelized cheese edges change everything. We explain why this style might be underrated in our market.",
    reviewer: "David",
    status: "published",
    createdAt: "2026-01-08T00:00:00.000Z",
    updatedAt: "2026-01-08T00:00:00.000Z",
  },
];

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  const store = reviewsStore();
  const existing = await store.list();
  if (existing.blobs.length === 0) {
    await Promise.all(
      SEED_REVIEWS.map((r) => store.setJSON(r.slug, r))
    );
  }
  seeded = true;
}

export async function listAllReviews(): Promise<Review[]> {
  await ensureSeeded();
  const store = reviewsStore();
  const { blobs } = await store.list();
  const reviews = await Promise.all(
    blobs.map((b) => store.get(b.key, { type: "json" }) as Promise<Review>)
  );
  return reviews
    .filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listPublishedReviews(): Promise<Review[]> {
  const all = await listAllReviews();
  return all.filter((r) => r.status === "published");
}

export async function listLockedReviews(): Promise<Review[]> {
  const all = await listAllReviews();
  return all.filter((r) => r.status === "locked");
}

export async function getReview(slug: string): Promise<Review | null> {
  await ensureSeeded();
  const store = reviewsStore();
  const review = (await store.get(slug, { type: "json" })) as Review | null;
  return review ?? null;
}

export async function getPublishedReview(slug: string): Promise<Review | null> {
  const review = await getReview(slug);
  return review && review.status === "published" ? review : null;
}

export type ReviewInput = {
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
  shmuelVideoKey?: string;
  shmuelThumbnailKey?: string;
  shmuelRating?: number;
};

export async function createReview(input: ReviewInput): Promise<Review> {
  const store = reviewsStore();
  let slug = slugify(`${input.title}-${input.store}`) || `review-${Date.now()}`;
  let attempt = 0;
  while (await store.get(slug)) {
    attempt += 1;
    slug = `${slugify(`${input.title}-${input.store}`)}-${attempt}`;
  }
  const now = new Date().toISOString();
  const review: Review = { ...input, slug, createdAt: now, updatedAt: now };
  await store.setJSON(slug, review);
  return review;
}

export async function updateReview(
  slug: string,
  input: ReviewInput
): Promise<Review | null> {
  const store = reviewsStore();
  const existing = (await store.get(slug, { type: "json" })) as Review | null;
  if (!existing) return null;
  const updated: Review = {
    ...input,
    slug,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await store.setJSON(slug, updated);
  return updated;
}

export async function deleteReview(slug: string): Promise<void> {
  await reviewsStore().delete(slug);
}
