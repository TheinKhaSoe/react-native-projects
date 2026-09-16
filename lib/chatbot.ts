import { findCategory } from "./categories";
import {
  addMonths,
  currentMonthKey,
  monthLabel,
  shiftDays,
  startOfWeek,
  todayISO
} from "./dates";
import { t as translate, type Lang, type TKey } from "./i18n";
import { formatMoney, parseAmount } from "./money";

export interface BotData {
  currency: string;
  today: string;
  month: string;
  daysLeft: number;
  lang: Lang;
  fixedIncome: number;
  /** Current month numbers */
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
};

function detectTimeframe(text: string): Timeframe | null {
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
      return data.summary.expense;
    case "lastMonth":
      return data.lastMonth.expense;
    default:
      return 0;
  }
}

function tr(
  data: BotData,
  key: TKey,
  params?: Record<string, string | number>,
): string {
  return translate(data.lang, key, params);
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

function summaryText(data: BotData): string {
  const s = data.summary;
  return tr(data, "bot.summaryLine", {
    month: monthLabel(data.month, data.lang),
    income: formatMoney(s.income, data.currency),
    expense: formatMoney(s.expense, data.currency),
    left: formatMoney(s.left, data.currency),
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
  const list = data.categories;
  const hit = list.find((c) => c.category === category);
  if (!hit) {
    return tr(data, "bot.catNone", { category });
  }
  return tr(data, "bot.catMonth", {
    category,
    amount: formatMoney(hit.total, data.currency),
    pct: ((hit.total / Math.max(1, data.summary.expense)) * 100).toFixed(0),
  });
}

function incomeReply(data: BotData, tf: Timeframe | null): string {
  const s = data.summary;
  if (tf?.kind === "today") {
    return tr(data, "bot.incomeToday", {
      month: monthLabel(data.month, data.lang),
      amount: formatMoney(s.income, data.currency),
    });
  }
  if (tf?.kind === "lastMonth") {
    return tr(data, "bot.incomeLast", {
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

function leftReply(data: BotData): string {
  const s = data.summary;
  return tr(data, "bot.leftLine", {
    left: formatMoney(s.left, data.currency),
    total: formatMoney(s.income, data.currency),
    spent: formatMoney(s.expense, data.currency),
  });
}

export function interpret(raw: string, data: BotData): string {
  let text = raw.toLowerCase().trim();
  if (!text) return tr(data, "bot.fallback");

  // Save original (digit-converted) text for category lookup,
  // because b2e normalization may replace Burmese category names
  // (e.g. လစာ → income) before findCategory runs.
  let b2eOriginal = text;

  // Normalize Burmese input to keywords the English regexes expect.
  if (data.lang === "my") {
    // Convert Myanmar digits and comma to ASCII
    const mmDigits = "၀၁၂၃၄၅၆၇ၸ၉";
    let converted = "";
    for (const ch of text) {
      const idx = mmDigits.indexOf(ch);
      if (idx >= 0) {
        converted += String(idx);
      } else if (ch === "၊" || ch === "，") {
        converted += ",";
      } else {
        converted += ch;
      }
    }
    text = converted;
    b2eOriginal = converted;

    const b2e: [RegExp, string][] = [
      [/ထည့်ပါ|ထည့်/g, "add"],
      [/မှတ်ပါ|မှတ်/g, "log"],
      [/စေတင်/g, "track"],
      [/အချက်|မှတ်/g, "record"],
      [/ဝင်\s*ငွေ|ငွေ\s*ဝင်|လစာ|အထူ်|အချဝ်|လုပ်\s*ငယ်|အလေ့အ\s*ငွေ/g, "income"],
      [/ထွက်\s*ငွေ|ငွေ\s*ထွက်|အသုံး|အကုန်|ပေး\s*ငွေ|ဝယ်|ဝယ်\s*မည်|ရရှိ|လက်ခဏာ/g, "expense"],
      [/ဒီနေ့|အနေ့/g, "today"],
      [/မနေ့က|မနေ့/g, "yesterday"],
      [/ဒီ\s*အပတ်|ဒီ\s*ပတ်/g, "this week"],
      [/ပြီးခဲ့\s*သော\s*အပတ်|လီးမှ/g, "last week"],
      [/ဒီ\s*လ|ဒီ\s*မျကည်/g, "this month"],
      [/ပြီးခဲ့\s*သော\s*လ|လီးမှ\s*လ/g, "last month"],
      [/ဘယ်\s*လောက်|မည်မျှ|မည်သလောက်/g, "how much"],
      [/လက်ကျန်|ကျန်|လက်ခဏာ|ဘတ်ဂျက်|ဘတ်/g, "left"],
      [/အနှစ်ချုပ်|အစီရင်ခံ|အနားဦး|စာရင်း|report|status|situation/g, "summary"],
      [/အကြီးဆုံး|အဒြီး|အကြီး/g, "biggest"],
      [/အထင်ကရ|အလေ့အ|စာရင်း/g, "overview"],
      [/ကူညီ|help|what can you do|commands|examples/g, "help"],
      [/thank|thanks|thx|nice|great|cool|awesome/g, "thanks"],
      [/သတိပပ\s*ငွေ|စာရင်းကောက်|ငွေကြေး\s*တစ်\s*နေ့|per day|each day|allowance/g, "per day"],
      [/မေး\s*ငွေ|မေး\s*စရာ|မေး\s*နိုင်/g, "how many"],
      [/အားလုံး|all|/g, ""],
      [/^(ပိတ်|အိပ်|အလုပ်|အခွင့်အနက်|လာ|သွား)/g, "hi"],
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
    const isIncome = /income|salary|earned|earning|received|bonus|gift|freelance|^income\b/.test(text);
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
  if (
    /\bleft\b|balance|remaining|afford|how much budget|over budget/.test(text)
  ) {
    return leftReply(data);
  }

  /* ---- Income queries ------------------------------------------- */
  if (/income|earn|earned|salary|revenue|made\b|make\b/.test(text)) {
    const tf = detectTimeframe(text);
    if (/\bsalary\b|fixed/.test(text) && !tf) {
      return tr(data, "bot.incomeFixed", {
        amount: formatMoney(data.fixedIncome, data.currency),
      });
    }
    return incomeReply(data, tf);
  }

  /* ---- Spending queries ----------------------------------------- */
  if (/spen|spent|pay|paid|bought|purchase|expense/.test(text)) {
    const tf = detectTimeframe(text);

    /* "spent on food / transport" — category query */
    const category = findCategory(text);
    if (category && /\bon\b/.test(text)) {
      return categoryText(data, category, tf);
    }

    if (/\bbiggest\b|\blargest\b|\bmost\b|\btop\b/.test(text)) {
      if (!data.biggest) {
        return tr(data, "bot.noExpenses");
      }
      return `🏆 ${tr(data, "bot.biggestLine", {
        amount: formatMoney(data.biggest.amount, data.currency),
        category: data.biggest.category,
        date: data.biggest.date,
      })}${data.biggest.note ? ` (${data.biggest.note})` : ""}`;
    }

    const timeframe = tf ?? {
      label: "this month",
      from: `${data.month}-01`,
      to: data.today,
      kind: "month" as const,
    };
    const total = spentFor(data, timeframe);
    const line = tr(data, "bot.spentLine", {
      amount: formatMoney(total, data.currency),
      period: tr(data, "bot.todayWord", {}),
      left: formatMoney(data.summary.left, data.currency),
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
    return categoryText(data, category, detectTimeframe(text));
  }

  /* ---- Biggest (without spend words) ---------------------------- */
  if (/\bbiggest\b|\blargest\b|\bmost expensive\b/.test(text)) {
    if (!data.biggest) {
      return tr(data, "bot.noExpenses");
    }
    return tr(data, "bot.biggestLine", {
      amount: formatMoney(data.biggest.amount, data.currency),
      category: data.biggest.category,
      date: data.biggest.date,
    });
  }

  /* ---- Summary / overview / report ------------------------------ */
  if (/summary|overview|report|status|situation/.test(text)) {
    return summaryText(data);
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
  const bareTf = detectTimeframe(text);
  if (bareTf) {
    if (/income|earn|salary/.test(text)) return incomeReply(data, bareTf);
    const total = spentFor(data, bareTf);
    const line = tr(data, "bot.spentLine", {
      amount: formatMoney(total, data.currency),
      period: bareTf.label.charAt(0).toUpperCase() + bareTf.label.slice(1),
      left: formatMoney(data.summary.left, data.currency),
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
