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
  return list.find((c) => c.name === category)?.emoji ?? "📦";
}

/**
 * Words/phrases people actually type, mapped to our English category names.
 * Burmese synonyms are included so users can type in Burmese script.
 */
const SYNONYMS: Record<string, string[]> = {
  Food: [
    "food", "eat", "eating", "lunch", "dinner", "breakfast", "coffee", "tea",
    "snack", "restaurant", "grocery", "groceries", "meal", "meals", "drink",
    "drinks",
    "အစားအသောက်", "အစာ", "စား", "စားသောက်", "မနက်စာ", "နေ့လယ်စာ",
    "ညစာ", "ကော်ဖီ", "လက်ဖက်ရည်", "မုန့်", "စားသောက်ဆိုင်",
  ],
  Transport: [
    "transport", "transportation", "bus", "taxi", "train", "fuel", "gas",
    "petrol", "ride", "grab", "uber", "commute", "fare",
    "သယ်ယူပို့ဆောင်ရေး", "ယာဉ်", "ကား", "ဘတ်စ်ကား", "တက်ကစီ",
    "ရထား", "ဆီ", "ဓာတ်ဆီ", "ယာဉ်စီးခ", "ကားခ", "ခရီးစရိတ်",
  ],
  Shopping: [
    "shopping", "shop", "clothes", "shoes", "mall", "bag", "amazon",
    "ဈေးဝယ်ခြင်း", "ဈေးဝယ်", "အဝတ်အစား", "ဖိနပ်", "အိတ်",
    "ကုန်ပစ္စည်း", "ဝယ်", "ဝယ်ယူ",
  ],
  Bills: [
    "bill", "bills", "rent", "electricity", "water", "internet", "wifi",
    "phone", "utility", "utilities", "subscription",
    "ဘီလ်", "ဘီလ်များ", "အိမ်ငှားခ", "အိမ်လခ", "လျှပ်စစ်မီး",
    "မီးဖိုး", "ရေဖိုး", "ရေခ", "အင်တာနက်", "ဝိုင်ဖိုင်",
    "ဖုန်းဘေလ်", "ဖုန်းဖိုး", "စာရင်းသွင်းခ",
     "ငွေတောင်းခံလွှာများ",
  ],
  Health: [
    "health", "medicine", "doctor", "hospital", "pharmacy", "gym",
    "ကျန်းမာရေး", "ဆေး", "ဆေးဝါး", "ဆရာဝန်", "ဆေးရုံ",
    "ဆေးဆိုင်", "အားကစားရုံ", "လေ့ကျင့်ခန်း",
  ],
  Fun: [
    "fun", "game", "games", "movie", "cinema", "entertainment", "party",
    "အပန်းဖြေမှု", "အပန်းဖြေ", "ဂိမ်း", "ရုပ်ရှင်",
    "ရုပ်ရှင်ရုံ", "ဖျော်ဖြေရေး", "ပါတီ",
  ],
  Education: [
    "education", "school", "book", "books", "course", "tuition",
    "ပညာရေး", "ကျောင်း", "စာအုပ်", "သင်တန်း", "သင်တန်းကြေး",
    "ကျောင်းလခ", "ကျူရှင်",
  ],
  Salary: ["salary", "wage", "paycheck", "pay", "payroll", "လစာ", "လုပ်ခ", "အခြေခံလစာ", "ပုံသေလစာ", "လစာငွေ"],
  Freelance: [
    "freelance", "freelancing", "gig", "side", "client",
    "အလွတ်တန်းအလုပ်", "အလွတ်တန်း", "အပိုအလုပ်", "အပိုဝင်ငွေ", "ဖောက်သည်",
  ],
  Bonus: ["bonus", "tip", "reward", "ဆုကြေး", "အပိုဆုကြေး", "ဆုငွေ", "ဆု", "ဘောနပ်စ်", "အပိုဆု"],
  Gift: ["gift", "present", "received", "လက်ဆောင်", "လက်ဆောင်ငွေ", "လက်ဆောင်ရ", "လက်ခံရရှိ"],
  Other: ["other", "misc", "miscellaneous", "အခြား", "အခြားအမျိုးအစား", "အထွေထွေ"],
};

/**
 * Normalize text without destroying Burmese Unicode characters.
 * Uses explicit Myanmar Unicode range (U+1000–U+109F) instead of
 * \p{L} which may not work in all JS engines (e.g. Hermes).
 */
function normalizeText(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\u1000-\u109Fa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build lookup table from synonyms.
 *
 * Example:
 * "food" -> "Food"
 * "အစာ်ဗေ့များ" -> "Food"
 * "uber" -> "Transport"
 * "ကား" -> "Transport"
 */
const CATEGORY_BY_WORD: Record<string, string> = {};

for (const [category, synonyms] of Object.entries(SYNONYMS)) {
  CATEGORY_BY_WORD[normalizeText(category)] = category;

  for (const synonym of synonyms) {
    CATEGORY_BY_WORD[normalizeText(synonym)] = category;
  }
}

/**
 * Find a category mentioned in free text.
 *
 * Examples:
 * findCategory("expense 5000 food") -> "Food"
 * findCategory("expense 5000 အစာ်ဗေ့များ") -> "Food"
 * findCategory("add expense 5000 lunch") -> "Food"
 * findCategory("ထွက်ငွေ 5000 အစာ်ဗေ့များ") -> "Food"
 */
export function findCategory(text: string): string | null {
  const normalized = normalizeText(text);

  if (!normalized) {
    return null;
  }

  /*
   * First check complete phrases.
   * This is important for Burmese phrases such as:
   * "အစာ်ဗေ့များ" (Food)
   * "သယ်ယူပို့ဆောင်ရေး" (Transport)
   * "ဈေးဝယ်ခြင်း" (Shopping)
   */
  const entries = Object.entries(CATEGORY_BY_WORD).sort(
    ([a], [b]) => b.length - a.length,
  );

  for (const [phrase, category] of entries) {
    if (
      normalized === phrase ||
      normalized.includes(` ${phrase} `) ||
      normalized.startsWith(`${phrase} `) ||
      normalized.endsWith(` ${phrase}`)
    ) {
      return category;
    }
  }

  /*
   * Then check individual words.
   */
  const words = normalized.split(" ");

  for (const word of words) {
    const category = CATEGORY_BY_WORD[word];

    if (category) {
      return category;
    }
  }

  return null;
}
