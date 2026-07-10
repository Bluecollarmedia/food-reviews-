export type Comment = {
  id: string;
  name: string;
  message: string;
  timeAgo: string;
};

export type Reviewer = "David" | "Shmuel" | "David & Shmuel";

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
};

export const categories = [
  "Pizza",
  "Fast Food",
  "Dairy",
  "Meat",
  "Desserts",
  "Drinks",
] as const;

export const cities = ["Lakewood", "Toms River"] as const;

export const reviewers: Reviewer[] = ["David", "Shmuel", "David & Shmuel"];

export const reviews: Review[] = [
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
  },
];

export function getReviewBySlug(slug: string) {
  return reviews.find((r) => r.slug === slug);
}

export function getRelatedReviews(review: Review, limit = 3) {
  const scored = reviews
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
