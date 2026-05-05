export const CATEGORIES = [
  "Gadgets",
  "Clothing",
  "Food",
  "Subscription",
  "Travel",
  "Home",
  "Beauty",
  "Entertainment",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { emoji: string; color: string }> = {
  Gadgets: { emoji: "📱", color: "bg-blue-500" },
  Clothing: { emoji: "👕", color: "bg-pink-500" },
  Food: { emoji: "🍔", color: "bg-orange-500" },
  Subscription: { emoji: "🔁", color: "bg-purple-500" },
  Travel: { emoji: "✈️", color: "bg-cyan-500" },
  Home: { emoji: "🛋️", color: "bg-amber-600" },
  Beauty: { emoji: "💄", color: "bg-rose-500" },
  Entertainment: { emoji: "🎮", color: "bg-indigo-500" },
  Other: { emoji: "🛍️", color: "bg-slate-500" },
};

const KEYWORDS: Record<Category, string[]> = {
  Gadgets: ["iphone", "phone", "laptop", "macbook", "ipad", "tablet", "headphone", "airpod", "camera", "monitor", "keyboard", "mouse", "console", "ps5", "xbox", "tv", "drone", "watch", "kindle", "gpu"],
  Clothing: ["shirt", "pants", "jeans", "dress", "shoes", "sneaker", "jacket", "coat", "hoodie", "boot", "hat", "bag", "purse", "handbag", "outfit", "sweater"],
  Food: ["pizza", "burger", "sushi", "dinner", "lunch", "breakfast", "coffee", "starbucks", "doordash", "uber eats", "grocery", "restaurant", "takeout", "snack", "drink"],
  Subscription: ["subscription", "netflix", "spotify", "youtube premium", "prime", "disney", "hulu", "saas", "monthly", "membership", "gym"],
  Travel: ["flight", "hotel", "airbnb", "vacation", "trip", "ticket", "uber", "lyft", "rental car", "cruise", "resort"],
  Home: ["sofa", "couch", "chair", "table", "desk", "bed", "mattress", "lamp", "rug", "decor", "kitchen", "appliance", "cookware", "furniture"],
  Beauty: ["makeup", "skincare", "perfume", "cologne", "lipstick", "lotion", "salon", "haircut", "manicure", "spa"],
  Entertainment: ["game", "concert", "ticket", "movie", "book", "vinyl", "lego", "toy", "subscription box"],
  Other: [],
};

export function classifyCategory(item: string): Category {
  const t = item.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat === "Other") continue;
    if (KEYWORDS[cat].some((k) => t.includes(k))) return cat;
  }
  return "Other";
}

export function isValidCategory(c: unknown): c is Category {
  return typeof c === "string" && (CATEGORIES as readonly string[]).includes(c);
}