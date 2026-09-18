import { findCategory } from "./categories";
import {
  addMonths,
  currentMonthKey,
  monthLabel,
  shiftDays,
  startOfWeek,
  todayISO,
} from "./dates";
import {
  categoryLabel,
  MONTHS_EN,
  MONTHS_MY,
  t as translate,
  type Lang,
  type TKey,
} from "./i18n";
import { formatMoney, parseAmount } from "./money";

export interface BotData {
  currency: string;
  today: string;
  month: string;
  daysLeft: number;
  lang: Lang;
  fixedIncome: number;
  summary: { income: number; expense: number; left: number };
  todaySpent: number;
  yesterdaySpent: number;
  weekSpent: number;
  lastMonth: { income: number; expense: number; left: number };
  categories: { category: string; total: number }[];
  biggest: {
    amount: number;
    category: string;
    note: string | null;
    date: string;
  } | null;
  txCount: number;
  monthSummary: (
    monthKey: string,
  ) => Promise<{ income: number; expense: number; left: number } | null>;
  addExpense: (
    amount: number,
    category: string,
    note: string | null,
    date: string,
  ) => void;
  addIncome: (
    amount: number,
    category: string,
    note: string | null,
    date: string,
  ) => void;
}

type Timeframe = {
  label: string;
  from: string;
  to: string;
  kind: "today" | "yesterday" | "week" | "month" | "lastMonth" | "all";
  month?: string;
};

function detectMonth(text: string, lang: Lang): string | null {
  const lower = text.toLowerCase();
  const months = lang === "my" ? MONTHS_MY : MONTHS_EN;
  const currentMonthIndex = new Date().getMonth();
  for (let i = 0; i < months.length; i++) {
    if (lower.includes(months[i].toLowerCase())) {
      const cur = currentMonthKey();
      return addMonths(cur, i - currentMonthIndex);
    }
  }
  return null;
}

function detectTimeframe(text: string, lang?: Lang): Timeframe | null {
  const today = todayISO();
  if (/\btoday\b|\btonight\b|\bthis day\b/.test(text)) {
    return { label: "today", from: today, to: today, kind: "today" };
  }
  if (/\byesterday\b/.test(text)) {
    const y = shiftDays(today, -1);
    return { label: "yesterday", from: y, to: y, kind: "yesterday" };
  }
  if (/\bthis week\b|\bthe week\b|\bweek\b/.test(text)) {
    return {
      label: "this week",
      from: startOfWeek(today),
      to: today,
      kind: "week",
    };
  }
  if (/\blast week\b/.test(text)) {
    const start = shiftDays(startOfWeek(today), -7);
    return {
      label: "last week",
      from: start,
      to: shiftDays(startOfWeek(today), -1),
      kind: "week",
    };
  }
  if (/\blast month\b|\bprevious month\b/.test(text)) {
    const m = addMonths(currentMonthKey(), -1);
    const from = `${m}-01`;
    const to = shiftDays(`${addMonths(m, 1)}-01`, -1);
    return { label: "last month", from, to, kind: "lastMonth" };
  }
  if (/\bthis month\b|\bmonth\b|\bso far\b/.test(text)) {
    return {
      label: "this month",
      from: `${currentMonthKey()}-01`,
      to: today,
      kind: "month",
    };
  }
  const monthKey = detectMonth(text, lang ?? "en");
  if (monthKey) {
    const from = `${monthKey}-01`;
    const to = shiftDays(`${addMonths(monthKey, 1)}-01`, -1);
    return {
      label: monthLabel(monthKey, lang ?? "en"),
      from,
      to,
      kind: "month",
      month: monthKey,
    };
  }
  return null;
}

function spentFor(data: BotData, tf: Timeframe): number {
  switch (tf.kind) {
    case "today":
      return data.todaySpent;
    case "yesterday":
      return data.yesterdaySpent;
    case "week":
      return data.weekSpent;
    case "month":
      if (tf.month && tf.month !== data.month) return 0;
      return data.summary.expense;
    case "lastMonth":
      return data.lastMonth.expense;
    default:
      return 0;
  }
}

async function monthSummary(
  data: BotData,
  tf: Timeframe,
): Promise<{ income: number; expense: number; left: number } | null> {
  if (!tf.month || tf.month === data.month) return data.summary;
  if (tf.month === addMonths(data.month, -1)) return data.lastMonth;
  return data.monthSummary(tf.month);
}

function budgetLeftFor(data: BotData, tf: Timeframe): number {
  return tf.kind === "lastMonth" ? data.lastMonth.left : data.summary.left;
}

function tr(
  data: BotData,
  key: TKey,
  params?: Record<string, string | number>,
): string {
  return translate(data.lang, key, params);
}

const TF_LABEL_KEY: Record<Timeframe["kind"], TKey> = {
  today: "bot.todayWord",
  yesterday: "bot.yesterdayWord",
  week: "bot.thisWeek",
  month: "bot.thisMonth",
  lastMonth: "bot.lastMonth",
  all: "bot.thisMonth",
};

function timeframeLabel(data: BotData, tf: Timeframe): string {
  if (tf.label === "last week") return tr(data, "bot.lastWeek");
  if (tf.kind === "month") {
    return tf.month
      ? monthLabel(tf.month, data.lang)
      : monthLabel(data.month, data.lang);
  }
  if (tf.kind === "lastMonth")
    return monthLabel(addMonths(data.month, -1), data.lang);
  const key = TF_LABEL_KEY[tf.kind] ?? "bot.thisMonth";
  return tr(data, key);
}

function dailyAllowanceLine(data: BotData): string {
  const perDay = data.summary.left / Math.max(1, data.daysLeft);
  const mood = perDay <= 0 ? ` ${tr(data, "bot.overMood")}` : "";
  return (
    tr(data, "bot.dailyAllowance", {
      amount: formatMoney(Math.max(0, perDay), data.currency),
      days: data.daysLeft,
    }) + mood
  );
}

/* ------------------------------------------------------------------ */
/* Intents                                                             */
/* ------------------------------------------------------------------ */

function greeting(data: BotData): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const greetingKey = `greeting.${part}` as const;
  const g =
    greetingKey === "greeting.morning"
      ? tr(data, "greeting.morning")
      : greetingKey === "greeting.afternoon"
        ? tr(data, "greeting.afternoon")
        : tr(data, "greeting.evening");
  return `${g}! 👋 ${tr(data, "bot.greetingLine")} ${dailyAllowanceLine(data)}`;
}

async function summaryText(
  data: BotData,
  tf?: Timeframe | null,
): Promise<string> {
  const s = tf ? await monthSummary(data, tf) : data.summary;
  const safe = s ?? data.summary;
  return tr(data, "bot.summaryLine", {
    month: tf ? tf.label : monthLabel(data.month, data.lang),
    income: formatMoney(safe.income, data.currency),
    expense: formatMoney(safe.expense, data.currency),
    left: formatMoney(safe.left, data.currency),
  });
}

function categoryText(
  data: BotData,
  category: string,
  tf: Timeframe | null,
): string {
  if (tf && tf.kind !== "month" && tf.kind !== "lastMonth") {
    const total = spentFor(data, tf);
    return tr(data, "bot.catOtherTf", {
      amount: formatMoney(total, data.currency),
      period: tr(data, ("bot." + tf.kind) as TKey, {}),
    });
  }
  const list =
    tf && tf.month && tf.month !== data.month ? null : data.categories;
  const hit = list?.find((c) => c.category === category);
  const catLabel = categoryLabel(data.lang, category);
  if (!hit) {
    return tr(data, "bot.catNone", { category: catLabel });
  }
  const expenseTotal =
    tf?.month && tf.month !== data.month ? 0 : data.summary.expense;
  return tr(data, "bot.catMonth", {
    category: catLabel,
    amount: formatMoney(hit.total, data.currency),
    pct: ((hit.total / Math.max(1, expenseTotal)) * 100).toFixed(2),
  });
}

async function incomeReply(
  data: BotData,
  tf: Timeframe | null,
): Promise<string> {
  const s = data.summary;
  if (tf?.kind === "today" || tf?.kind === "yesterday" || tf?.kind === "week") {
    return tr(data, "bot.incomeToday", {
      month: monthLabel(data.month, data.lang),
      amount: formatMoney(s.income, data.currency),
    });
  }
  const m = tf ? await monthSummary(data, tf) : s;
  if (tf?.month && tf.month !== data.month && tf.kind !== "lastMonth") {
    return tr(data, "bot.incomeMonth", {
      month: tf.label,
      amount: formatMoney(m ? m.income : 0, data.currency),
      fixed: formatMoney(m ? m.income : 0, data.currency),
      fixedWord: tr(data, "bot.total"),
      extra: formatMoney(0, data.currency),
      extraWord: tr(data, "bot.extra"),
    });
  }
  if (tf?.kind === "lastMonth") {
    return tr(data, "bot.incomeLast", {
      month: monthLabel(addMonths(data.month, -1), data.lang),
      amount: formatMoney(data.lastMonth.income, data.currency),
    });
  }
  return tr(data, "bot.incomeMonth", {
    month: monthLabel(data.month, data.lang),
    amount: formatMoney(s.income, data.currency),
    fixed: formatMoney(data.fixedIncome, data.currency),
    fixedWord: tr(data, "bot.fixedSalary"),
    extra: formatMoney(s.income - data.fixedIncome, data.currency),
    extraWord: tr(data, "bot.extra"),
  });
}

async function leftReply(
  data: BotData,
  tf?: Timeframe | null,
): Promise<string> {
  const s = data.summary;
  const m = tf ? await monthSummary(data, tf) : s;
  const safeM = m ?? s;
  if (tf?.kind === "lastMonth") {
    return tr(data, "bot.leftLineLastMonth", {
      month: monthLabel(addMonths(data.month, -1), data.lang),
      left: formatMoney(safeM.left, data.currency),
      total: formatMoney(safeM.income, data.currency),
      spent: formatMoney(safeM.expense, data.currency),
    });
  }
  if (tf?.kind === "month") {
    return tr(data, "bot.leftLineMonth", {
      month: tf.label,
      left: formatMoney(safeM.left, data.currency),
      total: formatMoney(safeM.income, data.currency),
      spent: formatMoney(safeM.expense, data.currency),
    });
  }
  return tr(data, "bot.leftLine", {
    left: formatMoney(s.left, data.currency),
    total: formatMoney(s.income, data.currency),
    spent: formatMoney(s.expense, data.currency),
  });
}

export async function interpret(raw: string, data: BotData): Promise<string> {
  let text = raw.toLowerCase().trim();
  if (!text) return tr(data, "bot.fallback");

  // Save original (digit-converted) text for category lookup,
  // because b2e normalization may replace Burmese category names
  // (e.g. လစာ → income) before findCategory runs.
  let b2eOriginal = text;

  // Normalize Burmese input to keywords the English regexes expect.
  if (data.lang === "my") {
    // Convert Myanmar digits and Myanmar comma variants to ASCII.
    // ၀၁၂၃၄၅၆၇၈၉
    const mmDigits = "၀၁၂၃၄၅၆၇၈၉";

    let converted = "";

    for (const ch of text) {
      const idx = mmDigits.indexOf(ch);

      if (idx >= 0) {
        converted += String(idx);
      } else if (ch === "၊" || ch === "။" || ch === "，") {
        converted += ",";
      } else {
        converted += ch;
      }
    }

    text = converted;
    b2eOriginal = converted;

    /*
     * Myanmar → English intent normalization
     *
     * The chatbot understands multiple natural Myanmar expressions
     * that can mean the same thing.
     *
     * IMPORTANT:
     * Keep these mappings before the existing English intent logic.
     */

    const b2e: [RegExp, string][] = [
      /* --------------------------------------------------------------
       * ADD / RECORD
       * -------------------------------------------------------------- */

      [
        /ထည့်ပါ|ထည့်ပေးပါ|ထည့်ပေး|ထည့်လိုက်|ထည့်မယ်|ထည့်မည်|မှတ်ပါ|မှတ်ပေးပါ|မှတ်ပေး|မှတ်လိုက်|မှတ်မယ်|မှတ်မည်|စာရင်းသွင်း|စာရင်းထည့်|စာရင်းမှတ်/g,
        "add",
      ],

      /* --------------------------------------------------------------
       * EXPENSE / SPENDING
       * -------------------------------------------------------------- */

      [
        /ထွက်ငွေ|ငွေထွက်|အသုံးစရိတ်|အသုံးငွေ|အသုံး|သုံးငွေ|သုံးစွဲမှု|သုံးစွဲငွေ|သုံးထား|သုံးခဲ့|သုံးပြီး|သုံးလိုက်|ပိုက်ဆံသုံး|ငွေသုံး|ကုန်ငွေ|ကုန်ကျစရိတ်|ကုန်ကျငွေ|ကုန်ထား|ကုန်သွား|ပေးငွေ|ပေးထား|ပေးခဲ့|ဝယ်ထား|ဝယ်ခဲ့|ဝယ်လိုက်|ဝယ်ယူမှု/g,
        "expense",
      ],

      /* --------------------------------------------------------------
       * INCOME
       * -------------------------------------------------------------- */

      [
        /ဝင်ငွေ|ငွေဝင်|ပိုက်ဆံဝင်|ဝင်လာတဲ့ငွေ|ဝင်လာသောငွေ|ရငွေ|ရရှိငွေ|ရထားတဲ့ငွေ|ရရှိထားတဲ့ငွေ|ရလာတဲ့ငွေ|လစာ|လစာငွေ|အပိုဝင်ငွေ|အပိုငွေ|ဘောနပ်စ်|ဆုကြေး|အခကြေးငွေ|အလုပ်ခ|လုပ်ခ/g,
        "income",
      ],

      /* --------------------------------------------------------------
       * TODAY
       * -------------------------------------------------------------- */

      [/ဒီနေ့|ယနေ့|ဒီနေရာနေ့|ယနေ့မှာ|ဒီနေ့မှာ|ဒီနေ့အတွက်/g, "today"],

      /* --------------------------------------------------------------
       * YESTERDAY
       * -------------------------------------------------------------- */

      [/မနေ့က|မနေ့|မနေ့မှာ|မနေ့အတွက်|ယမန်နေ့/g, "yesterday"],

      /* --------------------------------------------------------------
       * THIS WEEK
       * -------------------------------------------------------------- */

      [
        /ဒီအပတ်|ဒီပတ်|ဒီတစ်ပတ်|ဒီတပတ်|ဒီအပတ်မှာ|ဒီအပတ်အတွင်း|ယခုအပတ်/g,
        "this week",
      ],

      /* --------------------------------------------------------------
       * LAST WEEK
       * -------------------------------------------------------------- */

      [
        /ပြီးခဲ့တဲ့အပတ်|ပြီးခဲ့သောအပတ်|ပြီးခဲ့တဲ့ပတ်|ပြီးခဲ့သောပတ်|မနှစ်ကအပတ်/g,
        "last week",
      ],

      /* --------------------------------------------------------------
       * THIS MONTH
       * -------------------------------------------------------------- */

      [/ဒီလ|ယခုလ|ဒီလမှာ|ဒီလအတွင်း|ဒီလအတွက်|ဒီလထဲမှာ|လက်ရှိလ/g, "this month"],

      /* --------------------------------------------------------------
       * LAST MONTH
       * -------------------------------------------------------------- */

      [
        /ပြီးခဲ့တဲ့လ|ပြီးခဲ့သောလ|ပြီးခဲ့တဲ့လမှာ|ပြီးခဲ့သောလမှာ|ပြီးခဲ့တဲ့လအတွင်း|ယခင်လ|အရင်လ/g,
        "last month",
      ],

      /* --------------------------------------------------------------
       * HOW MUCH
       * -------------------------------------------------------------- */

      [
        /ဘယ်လောက်|ဘယ်လောက်လဲ|ဘယ်လောက်ရှိ|ဘယ်လောက်သုံး|ဘယ်လောက်ကုန်|ဘယ်လောက်ကျ|မည်မျှ|မည်မျှလဲ|ဘယ်မျှ|ပမာဏဘယ်လောက်/g,
        "how much",
      ],

      /* --------------------------------------------------------------
       * LEFT / BALANCE / BUDGET
       * -------------------------------------------------------------- */

      [
        /လက်ကျန်|ကျန်ငွေ|ကျန်တဲ့ငွေ|ကျန်နေတဲ့ငွေ|ကျန်တာ|ဘယ်လောက်ကျန်|လက်ကျန်ငွေ|လက်ကျန်ဘတ်ဂျက်|ဘတ်ဂျက်လက်ကျန်|ဘတ်ဂျက်|အသုံးပြုနိုင်ငွေ|သုံးလို့ရတဲ့ငွေ|သုံးနိုင်တဲ့ငွေ/g,
        "left",
      ],

      /* --------------------------------------------------------------
       * SUMMARY / REPORT / OVERVIEW
       * -------------------------------------------------------------- */

      [
        /အနှစ်ချုပ်|အကျဉ်းချုပ်|စာရင်းချုပ်|စာရင်းအနှစ်ချုပ်|အစီရင်ခံစာ|အစီရင်ခံ|အစီရင်ခံစာကြည့်|အခြေအနေ|အခြေအနေကြည့်|ခြုံငုံ|ခြုံငုံကြည့်|စုစုပေါင်းအခြေအနေ/g,
        "summary",
      ],

      /* --------------------------------------------------------------
       * BIGGEST EXPENSE
       * -------------------------------------------------------------- */

      [
        /အကြီးဆုံး|အများဆုံး|အများဆုံးသုံး|အများဆုံးကုန်|အများဆုံးကုန်ကျ|အကြီးဆုံးထွက်ငွေ|အကြီးဆုံးအသုံးစရိတ်|ငွေအများဆုံးသုံး|ပိုက်ဆံအများဆုံးသုံး/g,
        "biggest",
      ],

      /* --------------------------------------------------------------
       * PER DAY / DAILY ALLOWANCE
       * -------------------------------------------------------------- */

      [
        /တစ်ရက်|တစ်နေ့|တစ်နေ့ကို|တစ်ရက်ကို|နေ့စဉ်|နေ့တိုင်း|တစ်နေ့လျှင်|တစ်ရက်လျှင်|တစ်နေ့ဘယ်လောက်|တစ်ရက်ဘယ်လောက်/g,
        "per day",
      ],

      /* --------------------------------------------------------------
       * TRANSACTION COUNT
       * -------------------------------------------------------------- */

      [
        /မှတ်တမ်းဘယ်နှခု|မှတ်တမ်းဘယ်လောက်|စာရင်းဘယ်နှခု|စာရင်းဘယ်လောက်|အကြိမ်ဘယ်လောက်|မှတ်တမ်းအရေအတွက်|စာရင်းအရေအတွက်/g,
        "how many",
      ],

      /* --------------------------------------------------------------
       * HELP
       * -------------------------------------------------------------- */

      [
        /ကူညီပါ|ကူညီပေးပါ|ကူညီပေး|အကူအညီ|ဘာလုပ်လို့ရ|ဘာတွေမေးလို့ရ|ဘာတွေမေးနိုင်|ဘယ်လိုသုံး|အသုံးပြုနည်း|လုပ်ဆောင်ချက်|လုပ်ဆောင်ချက်တွေ/g,
        "help",
      ],

      /* --------------------------------------------------------------
       * THANKS
       * -------------------------------------------------------------- */

      [
        /ကျေးဇူး|ကျေးဇူးတင်|ကျေးဇူးတင်ပါတယ်|ကျေးဇူးပါ|အရမ်းကျေးဇူးတင်|ကောင်းတယ်|အဆင်ပြေတယ်|အရမ်းကောင်း/g,
        "thanks",
      ],

      /* --------------------------------------------------------------
       * GREETINGS
       * -------------------------------------------------------------- */

      [
        /မင်္ဂလာပါ|မင်္ဂလာ|ဟယ်လို|ဟလို|ဟေး|နေကောင်းလား|မနက်ခင်း|နေ့လယ်|ညနေ/g,
        "hi",
      ],
    ];
    b2e.forEach(([re, en]) => {
      text = text.replace(re, en);
    });
  }

  /* ---- Add commands (must come first) --------------------------- */
  const amount = parseAmount(text);

  const addPrefix = /^add\b|^log\b|^record\b|^track\b/;
  const txTypePrefix = /^expense\b|^income\b/;

  if (
    addPrefix.test(text) ||
    (txTypePrefix.test(text) && amount !== null && amount > 0)
  ) {
    if (amount === null || amount <= 0) {
      return tr(data, "bot.addAmount");
    }
    const isIncome =
      /income|salary|earned|earning|received|bonus|gift|freelance|^income\b/.test(
        text,
      );
    const date = /\byesterday\b/.test(text)
      ? shiftDays(data.today, -1)
      : /\btomorrow\b/.test(text)
        ? shiftDays(data.today, 1)
        : data.today;
    const afterAmount = text
      .replace(/^(add|log|record|track|expense|income)\s+/, "")
      .replace(amount.toString(), " ");
    // Try normalized text first; if no match, try original Burmese text
    // (in case b2e replaced a category word like လစာ → income).
    const b2eAfterAmount = b2eOriginal
      .replace(/^\S+\s+/, "")
      .replace(amount.toString(), " ");
    const category =
      findCategory(afterAmount) ??
      findCategory(b2eAfterAmount) ??
      (isIncome ? "Other" : "Other");
    if (isIncome) {
      data.addIncome(amount, category, null, date);
      return tr(data, "bot.addedIncome", {
        amount: formatMoney(amount, data.currency),
        category,
      });
    }
    data.addExpense(amount, category, null, date);
    return tr(data, "bot.addedExpense", {
      amount: formatMoney(amount, data.currency),
      category,
      left: formatMoney(data.summary.left - amount, data.currency),
    });
  }

  /* ---- Greetings / thanks / help -------------------------------- */
  if (
    /^(hi|hello|hey|yo|mingalaba|min-ga-la-ba|good (morning|afternoon|evening))\b/.test(
      text,
    )
  ) {
    return greeting(data);
  }
  if (/thank|thanks|thx|nice|great|cool|awesome/.test(text)) {
    return tr(data, "bot.thanks");
  }
  if (/\bhelp\b|what can you do|commands|examples/.test(text)) {
    return tr(data, "bot.help");
  }

  /* ---- Budget left / balance ------------------------------------ */
  if (/\bleft\b|balance|remaining|afford|budget|over budget/.test(text)) {
    return await leftReply(data, detectTimeframe(text, data.lang));
  }

  /* ---- Income queries ------------------------------------------- */
  if (/income|earn|earned|salary|revenue|made\b|make\b/.test(text)) {
    const tf = detectTimeframe(text, data.lang);
    if (/\bsalary\b|fixed/.test(text) && !tf) {
      return tr(data, "bot.incomeFixed", {
        amount: formatMoney(data.fixedIncome, data.currency),
      });
    }
    return await incomeReply(data, tf);
  }

  /* ---- Spending queries ----------------------------------------- */
  if (/spen|spent|pay|paid|bought|purchase|expense/.test(text)) {
    const tf = detectTimeframe(text, data.lang);

    /* Category query — "spent on food", "food spending this month", etc. */
    const category = findCategory(text);
    if (category && (/\bon\b/.test(text) || tf)) {
      return categoryText(data, category, tf);
    }

    if (/\bbiggest\b|\blargest\b|\bmost\b|\btop\b/.test(text)) {
      if (!data.biggest) {
        return tr(data, "bot.noExpenses");
      }
      return `🏆 ${tr(data, "bot.biggestLine", {
        amount: formatMoney(data.biggest.amount, data.currency),
        category: categoryLabel(data.lang, data.biggest.category),
        date: data.biggest.date,
      })}${data.biggest.note ? ` (${data.biggest.note})` : ""}`;
    }

    const timeframe = tf ?? {
      label: "this month",
      from: `${data.month}-01`,
      to: data.today,
      kind: "month" as const,
    };
    let total: number;
    let left: number;
    if (!tf || tf.kind === "month") {
      const m = await monthSummary(data, timeframe);
      const safeM = m ?? data.summary;
      total = safeM.expense;
      left = safeM.left;
    } else {
      total = spentFor(data, timeframe);
      left = tf.kind === "lastMonth" ? data.lastMonth.left : data.summary.left;
    }
    const line = tr(data, "bot.spentLine", {
      amount: formatMoney(total, data.currency),
      period: timeframeLabel(data, timeframe),
      left: formatMoney(left, data.currency),
    });
    return total === 0 ? `✨ ${line}` : `📉 ${line}`;
  }

  /* ---- Category without "on" ------------------------------------ */
  const category = findCategory(text);
  if (
    category &&
    /food|transport|shopping|bills|health|fun|education|salary|freelance|bonus|gift/.test(
      text,
    )
  ) {
    return categoryText(data, category, detectTimeframe(text, data.lang));
  }

  /* ---- Biggest (without spend words) ---------------------------- */
  if (/\bbiggest\b|\blargest\b|\bmost expensive\b/.test(text)) {
    if (!data.biggest) {
      return tr(data, "bot.noExpenses");
    }
    return tr(data, "bot.biggestLine", {
      amount: formatMoney(data.biggest.amount, data.currency),
      category: categoryLabel(data.lang, data.biggest.category),
      date: data.biggest.date,
    });
  }

  /* ---- Summary / overview / report ------------------------------ */
  if (/summary|overview|report|status|situation/.test(text)) {
    return await summaryText(data, detectTimeframe(text, data.lang));
  }

  /* ---- Daily allowance ------------------------------------------ */
  if (/per day|each day|a day\b|allowance|can i spend per day/.test(text)) {
    return dailyAllowanceLine(data);
  }

  /* ---- Transaction count ---------------------------------------- */
  if (/how many transactions|how many entries|how many records/.test(text)) {
    return tr(data, "bot.txCount", { count: data.txCount });
  }

  /* ---- Bare timeframe ("today?", "this month?") ------------------ */
  const bareTf = detectTimeframe(text, data.lang);
  if (bareTf) {
    if (/income|earn|salary/.test(text)) return await incomeReply(data, bareTf);
    const m = await monthSummary(data, bareTf);
    const safeM = m ?? data.summary;
    let total: number;
    let left: number;
    if (bareTf.kind === "month") {
      total = safeM.expense;
      left = safeM.left;
    } else {
      total = spentFor(data, bareTf);
      left =
        bareTf.kind === "lastMonth" ? data.lastMonth.left : data.summary.left;
    }
    const line = tr(data, "bot.spentLine", {
      amount: formatMoney(total, data.currency),
      period: timeframeLabel(data, bareTf),
      left: formatMoney(left, data.currency),
    });
    return total === 0 ? `✨ ${line}` : `📉 ${line}`;
  }

  return tr(data, "bot.fallback");
}

export function welcomeMessage(
  t?: (key: TKey, params?: Record<string, string | number>) => string,
): string {
  if (t) return t("bot.welcome");
  return tr({ lang: "en" } as BotData, "bot.welcome");
}
