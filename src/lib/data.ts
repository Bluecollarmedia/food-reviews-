export type Comment = {
  id: string;
  name: string;
  message: string;
  timeAgo: string;
};

export type Review = {
  slug: string;
  title: string;
  category: string;
  location: string;
  rating: number;
  description: string;
  reviewer: "D" | "S" | "D & S";
  comments: Comment[];
};

export const categories = [
  "Pizza",
  "Burgers",
  "Tacos",
  "Wings",
  "Sushi",
  "BBQ",
  "Desserts",
] as const;

export const reviews: Review[] = [
  {
    slug: "downtown-pepperoni-slice",
    title: "This Pizza Almost Made Us Fight",
    category: "Pizza",
    location: "Tony's Slice House",
    rating: 4.5,
    description:
      "A thin-crust pepperoni slice that split the room. D loved the crispy edge, S thought the sauce was way too sweet. We argue it out and give our honest, brutal verdict.",
    reviewer: "D & S",
    comments: [
      { id: "c1", name: "Marcus", message: "Been waiting for you two to hit this place!", timeAgo: "2d" },
      { id: "c2", name: "Priya", message: "Sauce being sweet is a dealbreaker for me too.", timeAgo: "1d" },
    ],
  },
  {
    slug: "double-smash-burger",
    title: "Double Smash Burger Showdown",
    category: "Burgers",
    location: "Grease & Griddle",
    rating: 4,
    description:
      "Crispy lace edges, but is it worth the price? We break down the bun-to-patty ratio and don't hold back on the value verdict.",
    reviewer: "D",
    comments: [
      { id: "c3", name: "Alex", message: "That price point though...", timeAgo: "5h" },
    ],
  },
  {
    slug: "street-cart-al-pastor",
    title: "Street Cart Al Pastor - Hidden Gem?",
    category: "Tacos",
    location: "El Trompo Cart",
    rating: 5,
    description:
      "No seating, no menu, just a spinning trompo and pure flavor. This might be the most honest 5-star review we've ever given.",
    reviewer: "S",
    comments: [],
  },
  {
    slug: "nashville-hot-wings",
    title: "Nashville Hot Wings Nearly Broke Us",
    category: "Wings",
    location: "Firehouse Wing Co.",
    rating: 3.5,
    description:
      "Heat that's more pain than flavor past level 3. We rank every heat level so you know exactly what you're walking into.",
    reviewer: "D & S",
    comments: [
      { id: "c4", name: "Jordan", message: "Level 5 destroyed me too, respect for finishing it", timeAgo: "3d" },
    ],
  },
  {
    slug: "omakase-on-a-budget",
    title: "Omakase On a Budget - Worth It?",
    category: "Sushi",
    location: "Sato's Counter",
    rating: 4.5,
    description:
      "Twelve pieces, one chef, zero pretension. We compare it against the fancy uptown spot and the results surprised us.",
    reviewer: "D",
    comments: [],
  },
  {
    slug: "backyard-brisket",
    title: "12-Hour Brisket That Made S Cry",
    category: "BBQ",
    location: "Smoke Ring BBQ",
    rating: 5,
    description:
      "Bark, smoke ring, and a texture that shouldn't be legal. This is the review that made us BBQ believers.",
    reviewer: "D & S",
    comments: [
      { id: "c5", name: "Casey", message: "The bark on that thing looks insane", timeAgo: "1w" },
    ],
  },
  {
    slug: "mall-food-court-cheesecake",
    title: "We Tried Mall Food Court Cheesecake",
    category: "Desserts",
    location: "Food Court Bakery Stand",
    rating: 2.5,
    description:
      "Low expectations, even lower results. A brutally honest breakdown of why mall dessert stands live and die on frosting alone.",
    reviewer: "S",
    comments: [],
  },
  {
    slug: "detroit-style-deep-dish",
    title: "Detroit-Style Deep Dish, Explained",
    category: "Pizza",
    location: "Motor City Pie Co.",
    rating: 4,
    description:
      "Caramelized cheese edges change everything. We explain why this style might be underrated in our market.",
    reviewer: "D",
    comments: [],
  },
];

export function getReviewBySlug(slug: string) {
  return reviews.find((r) => r.slug === slug);
}
