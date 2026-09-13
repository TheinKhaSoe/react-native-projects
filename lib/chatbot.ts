import { formatMoney, parseAmount } from "./money";
import { findCategory } from "./categories";
import {
  addMonths,
  currentMonthKey,
  daysLeftInMonth,
  monthLabel,
  shiftDays,
  startOfWeek,
  todayISO,
} from "./dates";

export interface BotData {
  currency: string;
  today: string;
  month: string;
  daysLeft: number;
  fixedIncome: number;
  /** Current month numbers */
  summary: { income: number; expense: number; left: number };
  todaySpent: number;
  yesterdaySpent: number;
  weekSpent: number;
  lastMonth: { income: number; expense: number; left: number };
  categories: { category: string; total: number }[];
  biggest: { amount: number; category: string; note: string | null; date: string } | null;
  txCount: number;
  addExpense: (amount: number, category: string, note: string | null, date: string) => void;
  addIncome: (amount: number, category: string, note: string | null, date: string) => void;
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
    return { label: "this week", from: startOfWeek(today), to: today, kind: "week" };
  }
  if (/\blast week\b/.test(text)) {
    const start = shiftDays(startOfWeek(today), -7);
    return { label: "last week", from: start, to: shiftDays(startOfWeek(today), -1), kind: "week" };
  }
  if (/\blast month\b|\bprevious month\b/.test(text)) {
    const m = addMonths(currentMonthKey(), -1);
    const from = `${m}-01`;
    const to = shiftDays(`${addMonths(m, 1)}-01`, -1);
    return { label: "last month", from, to, kind: "lastMonth" };
  }
  if (/\bthis month\b|\bmonth\b|\bso far\b/.test(text)) {
    return { label: "this month", from: `${currentMonthKey()}-01`, to: today, kind: "month" };
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

function dailyAllowanceLine(data: BotData): string {
  const perDay = data.summary.left / Math.max(1, data.daysLeft);
  const mood = perDay <= 0 ? " ⚠️ You're over budget — time to slow down!" : "";
  return `Daily allowance: ~${formatMoney(Math.max(0, perDay), data.currency)} for the remaining ${data.daysLeft} day${data.daysLeft === 1 ? "" : "s"}.${mood}`;
}

/* ------------------------------------------------------------------ */
/* Intents                                                             */
/* ------------------------------------------------------------------ */

const HELP_TEXT = `I'm your wallet assistant 🤖 Ask me things like:

📉 "How much did I spend today / yesterday / this week / this month?"
📈 "Income this month?" · "How much did I earn today?"
💰 "How much budget left?" · "What's my balance?"
🍔 "How much did I spend on food this month?"
🏆 "What's my biggest expense?"
🧾 "Summary" · "Overview"
✍️ "Add expense 5000 lunch" · "Add income 3k freelance yesterday"`;

const FALLBACK = `Hmm, I didn't quite get that 🤔 Try one of these:
• "How much did I spend this month?"
• "Income this month?"
• "How much left?"
• "Spent on food?"
• "Add expense 5k coffee"

Type "help" to see everything I can do.`;

function greeting(data: BotData): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${part}! 👋 I can tell you your spending, income, and budget left. ${dailyAllowanceLine(data)}`;
}

function summaryText(data: BotData): string {
  const s = data.summary;
  return `📊 ${monthLabel(data.month)} overview
Income: ${formatMoney(s.income, data.currency)}
Expenses: ${formatMoney(s.expense, data.currency)}
Budget left: ${formatMoney(s.left, data.currency)}
${dailyAllowanceLine(data)}`;
}

function categoryText(data: BotData, category: string, tf: Timeframe | null): string {
  if (tf && tf.kind !== "month" && tf.kind !== "lastMonth") {
    const total = spentFor(data, tf);
    return `You've spent ${formatMoney(total, data.currency)} ${tf.label} in total. For category breakdowns I look at the whole month 🙂`;
  }
  const list = data.categories;
  const hit = list.find((c) => c.category === category);
  if (!hit) {
    return `No ${category} spending recorded this month ✨`;
  }
  return `${category} spending this month: ${formatMoney(hit.total, data.currency)} (${((hit.total / Math.max(1, data.summary.expense)) * 100).toFixed(0)}% of your expenses).`;
}

function incomeReply(data: BotData, tf: Timeframe | null): string {
  const s = data.summary;
  if (tf?.kind === "today") {
    return `Income recorded today is ad-hoc — I track fixed salary monthly plus extra income. ${monthLabel(data.month)} income so far: ${formatMoney(s.income, data.currency)} 💰`;
  }
  if (tf?.kind === "lastMonth") {
    return `Last month income: ${formatMoney(data.lastMonth.income, data.currency)} 💰`;
  }
  return `📈 ${monthLabel(data.month)} income: ${formatMoney(s.income, data.currency)} (fixed salary ${formatMoney(data.fixedIncome, data.currency)} + extra ${formatMoney(s.income - data.fixedIncome, data.currency)}).`;
}

function leftReply(data: BotData): string {
  const s = data.summary;
  return `💰 Budget left this month: ${formatMoney(s.left, data.currency)} out of ${formatMoney(s.income, data.currency)}.
You've spent ${formatMoney(s.expense, data.currency)} so far.
${dailyAllowanceLine(data)}`;
}

export function interpret(raw: string, data: BotData): string {
  const text = raw.toLowerCase().trim();
  if (!text) return FALLBACK;

  /* ---- Add commands (must come first) --------------------------- */
  if (/^add\b|^log\b|^record\b|^track\b/.test(text)) {
    const amount = parseAmount(text);
    if (amount === null || amount <= 0) {
      return `Got it — but how much? e.g. "add expense 5000 lunch" ✍️`;
    }
    const isIncome = /income|salary|earned|earning|received|bonus|gift|freelance/.test(text);
    const date =
      /\byesterday\b/.test(text)
        ? shiftDays(data.today, -1)
        : /\btomorrow\b/.test(text)
          ? shiftDays(data.today, 1)
          : data.today;
    const afterAmount = text.replace(/^(add|log|record|track)\s+/, "").replace(amount.toString(), " ");
    const category = findCategory(afterAmount) ?? (isIncome ? "Other" : "Other");
    if (isIncome) {
      data.addIncome(amount, category, null, date);
      return `✅ Added income ${formatMoney(amount, data.currency)} · ${category}. ${monthLabel(data.month)} income is now ${formatMoney(data.summary.income + amount, data.currency)}.`;
    }
    data.addExpense(amount, category, null, date);
    return `✅ Added expense ${formatMoney(amount, data.currency)} · ${category}. Left this month: ${formatMoney(data.summary.left - amount, data.currency)}.`;
  }

  /* ---- Greetings / thanks / help -------------------------------- */
  if (/^(hi|hello|hey|yo|mingalaba|min-ga-la-ba|good (morning|afternoon|evening))\b/.test(text)) {
    return greeting(data);
  }
  if (/thank|thanks|thx|nice|great|cool|awesome/.test(text)) {
    return `Anytime! 💚 Keep me posted on your spending.`;
  }
  if (/\bhelp\b|what can you do|commands|examples/.test(text)) {
    return HELP_TEXT;
  }

  /* ---- Budget left / balance ------------------------------------ */
  if (/\bleft\b|balance|remaining|afford|how much budget|over budget/.test(text)) {
    return leftReply(data);
  }

  /* ---- Income queries ------------------------------------------- */
  if (/income|earn|earned|salary|revenue|made\b|make\b/.test(text)) {
    const tf = detectTimeframe(text);
    if (/\bsalary\b|fixed/.test(text) && !tf) {
      return `Your fixed monthly salary is ${formatMoney(data.fixedIncome, data.currency)} 💼 (set it in Settings).`;
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
        return `No expenses recorded yet this month 🎉`;
      }
      return `🏆 Biggest expense this month: ${formatMoney(data.biggest.amount, data.currency)} · ${data.biggest.category} on ${data.biggest.date}${data.biggest.note ? ` (${data.biggest.note})` : ""}.`;
    }

    const timeframe = tf ?? { label: "this month", from: `${data.month}-01`, to: data.today, kind: "month" as const };
    const total = spentFor(data, timeframe);
    const emoji = total === 0 ? "✨" : "📉";
    return `${emoji} You've spent ${formatMoney(total, data.currency)} ${timeframe.label}. Left in budget: ${formatMoney(data.summary.left, data.currency)}.`;
  }

  /* ---- Category without "on" ------------------------------------ */
  const category = findCategory(text);
  if (category && /food|transport|shopping|bills|health|fun|education|salary|freelance|bonus|gift/.test(text)) {
    return categoryText(data, category, detectTimeframe(text));
  }

  /* ---- Biggest (without spend words) ---------------------------- */
  if (/\bbiggest\b|\blargest\b|\bmost expensive\b/.test(text)) {
    if (!data.biggest) {
      return `No expenses recorded yet this month 🎉`;
    }
    return `🏆 Biggest expense this month: ${formatMoney(data.biggest.amount, data.currency)} · ${data.biggest.category} on ${data.biggest.date}.`;
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
    return `🧾 You have ${data.txCount} transaction${data.txCount === 1 ? "" : "s"} recorded this month.`;
  }

  /* ---- Bare timeframe ("today?", "this month?") ------------------ */
  const bareTf = detectTimeframe(text);
  if (bareTf) {
    if (/income|earn|salary/.test(text)) return incomeReply(data, bareTf);
    const total = spentFor(data, bareTf);
    return `📉 ${bareTf.label.charAt(0).toUpperCase() + bareTf.label.slice(1)}: ${formatMoney(total, data.currency)} spent. Left this month: ${formatMoney(data.summary.left, data.currency)}.`;
  }

  return FALLBACK;
}

export function welcomeMessage(): string {
  return `Hi! I'm your wallet assistant 🤖💚
Ask me things like:
• "How much did I spend today?"
• "How much budget left?"
• "Income this month?"
• "Add expense 5k lunch"
Type "help" for the full list.`;
}
