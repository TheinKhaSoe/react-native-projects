export interface Category {
  name: string;
  emoji: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { name: "Food", emoji: "🍜" },
  { name: "Transport", emoji: "🚌" },
  { name: "Shopping", emoji: "🛍️" },
  { name: "Bills", emoji: "💡" },
  { name: "Health", emoji: "💊" },
  { name: "Fun", emoji: "🎮" },
  { name: "Education", emoji: "📚" },
  { name: "Other", emoji: "📦" },
];

export const INCOME_CATEGORIES: Category[] = [
  { name: "Salary", emoji: "💼" },
  { name: "Freelance", emoji: "💻" },
  { name: "Bonus", emoji: "🎉" },
  { name: "Gift", emoji: "🎁" },
  { name: "Other", emoji: "💰" },
];

export function categoriesFor(type: "income" | "expense"): Category[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function emojiFor(category: string, type: "income" | "expense"): string {
  const list = categoriesFor(type);
  return (list.find((c) => c.name === category) ?? { emoji: "📦" }).emoji;
}

/** Words people actually type, mapped to our categories. */
const SYNONYMS: Record<string, string[]> = {
  Food: [
    "food", "eat", "lunch", "dinner", "breakfast", "coffee", "tea", "snack",
    "restaurant", "grocery", "groceries", "meal", "drinks", "drink",
  ],
  Transport: [
    "transport", "bus", "taxi", "train", "fuel", "gas", "petrol", "ride",
    "grab", "uber", "commute", "fare",
  ],
  Shopping: ["shopping", "clothes", "shoes", "mall", "bag", "amazon"],
  Bills: [
    "bill", "bills", "rent", "electricity", "water", "internet", "wifi",
    "phone", "utility", "utilities", "subscription",
  ],
  Health: ["health", "medicine", "doctor", "hospital", "pharmacy", "gym"],
  Fun: ["fun", "game", "games", "movie", "cinema", "entertainment", "party"],
  Education: ["education", "school", "book", "books", "course", "tuition"],
  Salary: ["salary", "wage", "paycheck", "pay", "payroll"],
  Freelance: ["freelance", "freelancing", "gig", "side", "client"],
  Bonus: ["bonus", "tip", "reward"],
  Gift: ["gift", "present", "received"],
  Other: ["other", "misc", "miscellaneous"],
};

const CATEGORY_BY_WORD: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [category, words] of Object.entries(SYNONYMS)) {
    for (const w of words) map[w] = category;
    map[category.toLowerCase()] = category;
  }
  return map;
})();

/** Find a category mentioned in free text, or null. */
export function findCategory(text: string): string | null {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const w of words) {
    const hit = CATEGORY_BY_WORD[w];
    if (hit) return hit;
  }
  return null;
}
