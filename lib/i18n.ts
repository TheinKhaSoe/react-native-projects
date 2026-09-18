import { I18nManager, NativeModules, Platform } from "react-native";
import type { LanguageMode } from "./types";

/* ------------------------------------------------------------------ */
/* Language: Myanmar Burmese (my) / English (en)                       */
/* ------------------------------------------------------------------ */

export type Lang = "en" | "my";

export function resolveLang(mode: LanguageMode): Lang {
  if (mode === "en" || mode === "my") return mode;
  return deviceLang();
}

export function deviceLang(): Lang {
  try {
    if (Platform.OS === "web") {
      const nav = typeof navigator !== "undefined" ? navigator.language : "";
      return nav?.toLowerCase().startsWith("my") ? "my" : "en";
    }
    if (Platform.OS === "ios") {
      const appleLocale: string | undefined =
        NativeModules.SettingsManager?.settings?.AppleLocale ?? undefined;
      const firstLang: string | undefined =
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
        undefined;
      const locale = appleLocale ?? firstLang;
      return locale?.toLowerCase().startsWith("my") ? "my" : "en";
    }
    const locale: string | undefined =
      I18nManager.getConstants().localeIdentifier ?? undefined;
    return locale?.toLowerCase().startsWith("my") ? "my" : "en";
  } catch {
    return "en";
  }
}

type Entry = { en: string; my: string };

const DICT = {
  /* ---- Tabs ------------------------------------------------------ */
  "tab.wallet": { en: "Wallet", my: "ပိုက်ဆံအိတ်" },
  "tab.history": { en: "History", my: "မှတ်တမ်း" },
  "tab.report": { en: "Report", my: "အစီရင်ခံ" },
  "tab.chat": { en: "Chat", my: "စကားပြော" },
  "tab.settings": { en: "Settings", my: "ဆက်တင်များ" },

  /* ---- Home ------------------------------------------------------ */
  "greeting.morning": { en: "Good morning", my: "မင်္ဂလာနံနက်ခင်းပါ" },
  "greeting.afternoon": { en: "Good afternoon", my: "မင်္ဂလာနေ့လယ်ခင်းပါ" },
  "greeting.evening": { en: "Good evening", my: "မင်္ဂလာညနေခင်းပါ" },
  "wallet.mine": { en: "{name}'s Wallet", my: "{name} ၏ ပိုက်ဆံအိတ်" },
  "wallet.generic": { en: "My Wallet", my: "ကျွန်ုပ်၏ ပိုက်ဆံအိတ်" },
  "action.expense": { en: "Expense", my: "ထွက်ငွေ" },
  "action.income": { en: "Income", my: "ဝင်ငွေ" },
  "tile.totalIncome": { en: "Total income", my: "စုစုပေါင်း ဝင်ငွေ" },
  "tile.today": { en: "Today", my: "ဒီနေ့" },
  "tile.spent": { en: "Spent", my: "အသုံးစရိတ်" },
  "tile.budgetLeft": { en: "Budget left", my: "လက်ကျန်ဘတ်ဂျက်" },
  "tile.totalExpense": { en: "Total expense", my: "စုစုပေါင်း ထွက်ငွေ" },
  "home.recent": { en: "Recent activity", my: "လတ်တလော လုပ်ဆောင်ချက်" },
  "home.seeAll": { en: "See all", my: "အားလုံးကြည့်ရန်" },
  "empty.noTx.title": { en: "No transactions yet", my: "မှတ်တမ်း မရှိသေးပါ" },
  "empty.noTx.sub": {
    en: "Tap + Expense or + Income to get started",
    my: "စတင်ရန် + ထွက်ငွေ သို့ + ဝင်ငွေ ကို နှိပ်ပါ",
  },

  /* ---- Wallet card ----------------------------------------------- */
  "card.available": { en: "Available budget", my: "ရနိုင်သော ဘတ်ဂျက်" },
  "card.daysLeft": { en: "{days}d left", my: "ကျန် {days} ရက်" },
  "card.overBudget": {
    en: "⚠️ Over budget this month",
    my: "⚠️ ဒီလ ဘတ်ဂျက် ကျော်နေပါပြီ",
  },
  "card.perDay": {
    en: "≈ {amount} / day allowed",
    my: "≈ တစ်ရက် {amount} အသုံးပြုနိုင်",
  },
  "card.fixed": { en: "{amount} fixed", my: "{amount} (ပုံသေ)" },

  /* ---- Add screen ------------------------------------------------ */
  "add.title": { en: "New transaction", my: "မှတ်တမ်းအသစ်" },
  /* ---- Add Transaction ------------------------------------------- */
  "add.expense": { en: "Expense", my: "ထွက်ငွေ" },
  "add.income": { en: "Income", my: "ဝင်ငွေ" },
  "add.amount": { en: "Amount", my: "ပမာဏ" },
  "add.category": { en: "Category", my: "အမျိုးအစား" },
  "add.note": { en: "Note (optional)", my: "မှတ်ချက် (ရွေးချယ်နိုင်)" },
  "add.notePlaceholder": {
    en: "e.g. lunch with team",
    my: "ဥပမာ - အလုပ်ဖော်များနှင့် နေ့လည်စာ",
  },
  "add.today": { en: "Today", my: "ဒီနေ့" },
  "add.yesterday": { en: "Yesterday", my: "မနေ့က" },
  "add.pickDate": { en: "Pick date", my: "ရက်စွဲရွေးရန်" },
  "add.fixedSalary": {
    en: "Set as monthly fixed salary",
    my: "လစဉ် ပုံသေလစာအဖြစ် သတ်မှတ်",
  },
  "add.fixedSalaryHint": {
    en: "Applies this amount to every month as your baseline income.",
    my: "ဤပမာဏကို လစဉ် အခြေခံဝင်ငွေအဖြစ် အသုံးပြုပါ။",
  },
  "add.addIncome": { en: "Add income", my: "ဝင်ငွေထည့်" },
  "add.addExpense": { en: "Add expense", my: "ထွက်ငွေထည့်" },
  "add.saving": { en: "Saving…", my: "သိမ်းနေဆဲ…" },
  "add.date": { en: "Date", my: "ရက်စွဲ" },

  /* ---- Onboarding ------------------------------------------------ */
  "onb.title": {
    en: "Welcome to your wallet",
    my: "သင့်ပိုက်ဆံအိတ်မှ ကြိုဆိုပါသည်",
  },
  "onb.sub": {
    en: "What should we call you? Your name tells us whose wallet this is.",
    my: "သင့်ကို ဘယ်လိုခေါ်ရမလဲ။ ဤပိုက်ဆံအိတ်၏ ပိုင်ရှင်အမည်အဖြစ် အသုံးပြုပါမည်။",
  },
  "onb.namePlaceholder": { en: "Your name", my: "သင့်အမည်" },
  "onb.continue": { en: "Continue", my: "ဆက်လက်ရန်" },
  "onb.privacy": {
    en: "Your data stays on your device",
    my: "သင့်ဒေတာကို သင့်စက်ထဲတွင်သာ သိမ်းဆည်းထားပါသည်",
  },

  /* ---- Settings -------------------------------------------------- */
  "set.title": { en: "Settings", my: "ဆက်တင်များ" },
  "set.profile": { en: "Profile", my: "ပရိုဖိုင်" },
  "set.name": { en: "Your name", my: "သင့်အမည်" },
  "set.nameHint": {
    en: "This wallet belongs to {name} · saved automatically",
    my: "{name} ပိုင်ဆိုင်သော wallet · အလိုအလျောက်သိမ်းဆည်းထားပါသည်",
  },
  "set.appearance": { en: "Appearance", my: "အသွင်အပြင်" },
  "set.language": { en: "Language", my: "ဘာသာစကား" },
  "set.langHint": {
    en: "System",
    my: "စနစ်",
  },
  "set.langMy": { en: "Myanmar", my: "မြန်မာဘာသာ" },
  "set.langEn": { en: "English", my: "အင်္ဂလိပ်ဘာသာ" },
  "theme.system": { en: "System", my: "စနစ်" },
  "theme.light": { en: "Light", my: "အလင်း" },
  "theme.dark": { en: "Dark", my: "အမှောင်" },
  "set.money": { en: "Money", my: "ငွေကြေး" },
  "set.currency": { en: "Currency symbol", my: "ငွေကြေးသင်္ကေတ" },
  "set.salary": {
    en: "Monthly fixed income (salary)",
    my: "လစဉ် ပုံသေ ဝင်ငွေ (လစာ)",
  },
  "set.moneyHint": {
    en: "Counted as income for every month. Extra income can be added per transaction.",
    my: "လတိုင်း ဝင်ငွေအဖြစ် ရေတွက်ပါသည်။ အပိုဝင်ငွေများကိုလည်း ထည့်နိုင်ပါသည်။",
  },
  "set.data": { en: "Data", my: "ဒေတာ" },
  "set.reset": { en: "Reset all data", my: "ဒေတာအားလုံး ဖျက်မည်" },
  "set.resetMsg": {
    en: "Deletes your name, budget and every transaction (income, expense, history). You'll set up your profile again. This can't be undone.",
    my: "သင့်နာမည်၊ ဘတ်ဂျက်နှင့် ဝင်ငွေ၊ ထွက်ငွေ၊ မှတ်တမ်းအားလုံးကို ဖျက်မည်ဖြစ်သည်။ ပရိုဖိုင်ကို ပြန်လည်သတ်မှတ်ရမည်ဖြစ်ပြီး ပြန်လည်ရယူ၍ မရနိုင်ပါ။",
  },
  "set.footer": {
    en: "Expense Tracker · your data stays on your device",
    my: "အသုံးစရိတ်မှတ်တမ်း · သင့်ဒေတာကို သင့်စက်ထဲတွင်သာ သိမ်းဆည်းထားပါသည်",
  },
  "alert.cancel": { en: "Cancel", my: "မလုပ်တော့ပါ" },
  "alert.delete": { en: "Delete", my: "ဖျက်မည်" },
  "alert.reset": { en: "Reset", my: "ဖျက်မည်" },
  "alert.delTxTitle": { en: "Delete transaction", my: "မှတ်တမ်းကို ဖျက်မလား?" },
  "alert.delTxMsg": { en: "This can't be undone.", my: "ပြန်ရယူ၍ မရနိုင်ပါ။" },

  /* ---- History --------------------------------------------------- */
  "his.title": { en: "History", my: "မှတ်တမ်း" },
  "his.dailyExpenses": { en: "Daily expenses", my: "နေ့အလိုက် ထွက်ငွေများ" },
  "his.byCategory": {
    en: "Spending by category",
    my: "အမျိုးအစားအလိုက် အသုံးစရိတ်",
  },
  "his.transactions": { en: "Transactions", my: "မှတ်တမ်းများ" },
  "his.noExpenses": {
    en: "No expenses this month yet.",
    my: "ဒီလ ထွက်ငွေ မှတ်တမ်းမရှိသေးပါ။",
  },
  "his.empty.title": {
    en: "Nothing recorded this month",
    my: "ဒီလ မှတ်တမ်းမရှိသေးပါ",
  },
  "his.empty.sub": {
    en: "Switch months or add something with the + button",
    my: "လကို ပြောင်းကြည့်ပါ သို့မဟုတ် + ခလုတ်ဖြင့် မှတ်တမ်းတစ်ခု ထည့်ပါ",
  },
  "his.loading": { en: "Loading…", my: "ဖွင့်နေပါသည်…" },
  "his.ofIncome": { en: "of income", my: "ဝင်ငွေထဲမှ" },

  /* ---- Report tab -------------------------------------------------- */
  "report.title": {
    en: "Monthly Report",
    my: "လစဉ်အစီရင်ခံစာ",
  },

  "report.export": {
    en: "Export",
    my: "ထုတ်ယူရန်",
  },

  "report.exportTxt": {
    en: "Export as TXT",
    my: "TXT ဖိုင်အဖြစ် ထုတ်ယူရန်",
  },

  "report.exportCsv": {
    en: "Export as CSV",
    my: "CSV ဖိုင်အဖြစ် ထုတ်ယူရန်",
  },

  "report.exportTxtSave": {
    en: "Save as TXT",
    my: "TXT ဖိုင်အဖြစ် သိမ်းဆည်းရန်",
  },

  "report.exportTxtShare": {
    en: "Share as TXT",
    my: "TXT ဖိုင်အဖြစ် မျှဝေရန်",
  },

  "report.exportCsvSave": {
    en: "Save as CSV",
    my: "CSV ဖိုင်အဖြစ် သိမ်းဆည်းရန်",
  },

  "report.exportCsvShare": {
    en: "Share as CSV",
    my: "CSV ဖိုင်အဖြစ် မျှဝေရန်",
  },

  "report.exportSuccess": {
    en: "Exported successfully!",
    my: "အောင်မြင်စွာ ထုတ်ယူပြီးပါပြီ။",
  },

  "report.exportFailed": {
    en: "Export failed",
    my: "ထုတ်ယူမှု မအောင်မြင်ပါ",
  },

  "report.savedTo": {
    en: "Saved to device:\n{path}",
    my: "စက်ပစ္စည်းသို့သိမ်းဆည်းပါရသည်:\n{path}",
  },

  "report.exportHint": {
    en: "Export this month's data as TXT or CSV",
    my: "ဒီလ၏ အချက်အလက်များကို TXT သို့မဟုတ် CSV ဖိုင်အဖြစ် ထုတ်ယူနိုင်ပါသည်။",
  },

  "report.noTransactions": {
    en: "No transactions this month",
    my: "ဒီလတွင် မှတ်တမ်းမရှိပါ။",
  },

  "report.dailyExpenses": {
    en: "Daily expenses",
    my: "နေ့စဉ်ထွက်ငွေများ",
  },

  "report.byCategory": {
    en: "Spending by category",
    my: "အမျိုးအစားအလိုက် အသုံးစရိတ်",
  },

  "report.incomeByCategory": {
    en: "Income by category",
    my: "အမျိုးအစားအလိုက် ဝင်ငွေ",
  },

  "report.transactions": {
    en: "Transactions",
    my: "မှတ်တမ်းများ",
  },

  "report.expandAll": {
    en: "Expand all",
    my: "အားလုံးဖွင့်ရန်",
  },

  "report.collapseAll": {
    en: "Collapse all",
    my: "အားလုံးပိတ်ရန်",
  },

  "report.showIncome": {
    en: "Show income",
    my: "ဝင်ငွေပြရန်",
  },

  "report.hideIncome": {
    en: "Hide income",
    my: "ဝင်ငွေဖျောက်ရန်",
  },

  "report.total": {
    en: "Total",
    my: "စုစုပေါင်း",
  },

  "report.percentage": {
    en: "{pct}% of expenses",
    my: "ထွက်ငွေစုစုပေါင်း၏ {pct}%",
  },

  "report.emptyIncome": {
    en: "No income recorded",
    my: "ဝင်ငွေမှတ်တမ်း မရှိပါ။",
  },

  "report.emptyExpense": {
    en: "No expenses recorded",
    my: "ထွက်ငွေမှတ်တမ်း မရှိပါ။",
  },

  /* ---- Chat ------------------------------------------------------ */
  "chat.assistant": { en: "Wallet Assistant", my: "Wallet အကူ" },
  "chat.online": { en: "online", my: "အွန်လိုင်း" },
  "chat.typing": { en: "typing…", my: "ရိုက်နေပါသည်…" },
  "chat.placeholder": {
    en: "Ask about your money…",
    my: "သင့်ငွေကြေးအကြောင်း မေးပါ…",
  },
  "sug.today": { en: "Spent today?", my: "ဒီနေ့ ဘယ်လောက်အသုံးပြုခဲ့လဲ?" },
  "sug.incomeMonth": { en: "Income this month", my: "ဒီလ ဝင်ငွေ" },
  "sug.budgetLeft": { en: "Budget left", my: "လက်ကျန် ဘတ်ဂျက်" },
  "sug.summary": { en: "Summary", my: "အနှစ်ချုပ်" },
  "sug.addExpense": { en: "Add expense 5k lunch", my: "ထွက်ငွေ ၅,၀၀၀ ထည့်ပါ" },

  /* ---- Bot replies (plain words reused inside templates) ---------- */
  "bot.income": { en: "Income", my: "ဝင်ငွေ" },
  "bot.expenses": { en: "Expenses", my: "ထွက်ငွေ" },
  "bot.budgetLeft": { en: "Budget left", my: "လက်ကျန် ဘတ်ဂျက်" },
  "bot.spentWord": { en: "spent", my: "အသုံးစရိတ်" },
  "bot.fixedSalary": { en: "fixed salary", my: "ပုံသေ လစာ" },
  "bot.extra": { en: "extra", my: "အပို" },
  "bot.overview": { en: "overview", my: "အနှစ်ချုပ်" },
  "bot.todayWord": { en: "today", my: "ဒီနေ့" },
  "bot.yesterdayWord": { en: "yesterday", my: "မနေ့က" },
  "bot.thisWeek": { en: "this week", my: "ဒီအပတ်" },
  "bot.lastWeek": { en: "last week", my: "ပြီးခဲ့သောအပတ်" },
  "bot.thisMonth": { en: "this month", my: "ဒီလ" },
  "bot.lastMonth": { en: "Last month", my: "ပြီးခဲ့သောလ" },
  "bot.daysUnit": { en: "days", my: "ရက်" },
  "bot.dailyAllowance": {
    en: "Daily allowance: ~{amount} · {days} days left",
    my: "တစ်ရက် ခွင့်ပြုငွေ ~{amount} · ကျန် {days} ရက်",
  },
  "bot.overMood": {
    en: "⚠️ You're over budget — time to slow down!",
    my: "⚠️ ဘတ်ဂျက်ကျော်နေပါပြီ — အသုံးစရိတ်ကို လျှော့ချပါ!",
  },
  "bot.welcome": {
    en: 'Hi! I\'m your wallet assistant 🤖 \nAsk me things like:\n• "How much did I spend today?"\n• "How much budget left?"\n• "Income this month?"\n• "Add expense 5k lunch"\nType "help" for the full list.',
    my: 'မင်္ဂလာပါ။ ကျွန်ုပ်သည် wallet အကူ ဖြစ်သည် 🤖 \nမေးနိုင်သည့်များ:\n• "ဒီနေ့ ဘယ်လောက် အသုံးလဲ?"\n• "လက်ကျန် ဘတ်ဂျက် ဘယ်လောက်လဲ?"\n• "ဒီလ ဝင်ငွေ?"\n• "ထွက်ငွေ 5000 ထည့်"\nအားလုံးကြည့်ရန် "help" ဟု ရိုက်ပါ။',
  },
  "bot.help": {
    en: 'I\'m your wallet assistant 🤖 Ask me things like:\n\n📉 "How much did I spend today / this month?"\n📈 "Income this month?" · "How much did I earn today?"\n💰 "How much budget left?" · "What\'s my balance?"\n🍔 "How much did I spend on food this month?"\n🏆 "What\'s my biggest expense?"\n🧾 "Summary" · "Overview"\n✍️ "Add expense 5000 lunch"',
    my: 'ကျွန်ုပ်သည် ပိုက်ဆံအိတ် အကူ ဖြစ်သည် 🤖 မေးနိုင်သည့်များ:\n\n📉 "ဒီနေ့ / ဒီလ ဘယ်လောက် အသုံးလဲ?"\n📈 "ဒီလ ဝင်ငွေ?"\n💰 "လက်ကျန် ဘတ်ဂျက်?"\n🍔 "ဒီလ အစားအသောက် ဘယ်လောက် အသုံးလဲ?"\n🏆 "အကြီးဆုံး ထွက်ငွေ?"\n🧾 "အနှစ်ချုပ်"\n✍️ "ထွက်ငွေ 5000 ထည့်"',
  },
  "bot.fallback": {
    en: 'Hmm, I didn\'t quite get that 🤔 Try one of these:\n• "How much did I spend this month?"\n• "Income this month?"\n• "How much left?"\n• "Spent on food?"\n• "Add expense 5k coffee"\n\nType "help" to see everything I can do.',
    my: 'နားမလည်ပါ 🤔 ဒီများထဲမှ တစ်ခု စမ်းပါ:\n• "ဒီလ ဘယ်လောက် အသုံးလဲ?"\n• "ဒီလ ဝင်ငွေ?"\n• "လက်ကျန် ဘယ်လောက်လဲ?"\n• "ထွက်ငွေ 5000 ထည့်"\n\nအားလုံးကြည့်ရန် "help" ဟု ရိုက်ပါ။',
  },
  "bot.greetingLine": {
    en: "👋 I can tell you your spending, income, and budget left.",
    my: "👋 အသုံးစရိတ်၊ ဝင်ငွေနှင့် လက်ကျန်ဘတ်ဂျက်ကို ပြောပြနိုင်ပါသည်။",
  },
  "bot.summaryLine": {
    en: "📊 {month} overview\nIncome: {income}\nExpenses: {expense}\nBudget left: {left}",
    my: "📊 {month} အနှစ်ချုပ်\nဝင်ငွေ: {income}\nထွက်ငွေ: {expense}\nလက်ကျန်ဘတ်ဂျက်: {left}",
  },
  "bot.leftLine": {
    en: "💰 Budget left this month: {left} out of {total}.\nYou've spent {spent} so far.",
    my: "💰 ဒီလ လက်ကျန်ဘတ်ဂျက်: {left} / {total}။\nယခုအချိန်အထိ အသုံးပြုထားသည်: {spent}။",
  },
  "bot.spentLine": {
    en: "{period}: {amount} spent. Left in budget: {left}.",
    my: "{period}: {amount} အသုံးပြုထားသည်။ လက်ကျန်ဘတ်ဂျက်: {left}။",
  },
  "bot.biggestLine": {
    en: "🏆 Biggest expense this month: {amount} · {category} · {date}",
    my: "🏆 ဒီလ အကြီးဆုံး ထွက်ငွေ: {amount} · {category} · {date}",
  },
  "bot.noExpenses": {
    en: "No expenses recorded yet this month 🎉",
    my: "ဒီလ ထွက်ငွေ မှတ်တမ်း မရှိသေးပါ 🎉",
  },
  "bot.catMonth": {
    en: "{category} spending this month: {amount} ({pct}% of your expenses).",
    my: "ဒီလ {category} အသုံးစရိတ်: {amount} ({pct}%)။",
  },
  "bot.catNone": {
    en: "No {category} spending recorded this month ✨",
    my: "ဒီလ {category} အတွက် အသုံးစရိတ် မှတ်တမ်းမရှိပါ ✨",
  },
  "bot.catOtherTf": {
    en: "You've spent {amount} {period} in total. For category breakdowns I look at the whole month 🙂",
    my: "{period} အတွင်း စုစုပေါင်း {amount} အသုံးပြုထားပါသည်။",
  },
  "bot.incomeFixed": {
    en: "Your fixed monthly salary is {amount} 💼 (set it in Settings).",
    my: "သင့် လစဉ် ပုံသေ လစာမှာ {amount} 💼 (ဆက်တင်တွင် သတ်မှတ်ပါ)။",
  },
  "bot.incomeMonth": {
    en: "📈 {month} income: {amount} ({fixed} {fixedWord} + {extra} {extraWord}).",
    my: "📈 {month} ဝင်ငွေ: {amount} ({fixed} {fixedWord} + {extra} {extraWord})။",
  },
  "bot.incomeLast": {
    en: "Last month income: {amount} 💰",
    my: "ပြီးခဲ့သောလ ဝင်ငွေ: {amount} 💰",
  },
  "bot.incomeToday": {
    en: "Income recorded today is ad-hoc — I track fixed salary monthly plus extra income. {month} income so far: {amount} 💰",
    my: "ဒီနေ့ မှတ်တမ်းတင်ထားသော ဝင်ငွေသည် အပိုဝင်ငွေ ဖြစ်ပါသည်။ {month} ဝင်ငွေ စုစုပေါင်း: {amount} 💰",
  },
  "bot.addedIncome": {
    en: "✅ Added income {amount} · {category}.",
    my: "✅ ဝင်ငွေ {amount} ထည့်ပြီး · {category}။",
  },
  "bot.addedExpense": {
    en: "✅ Added expense {amount} · {category}. Left this month: {left}.",
    my: "✅ ထွက်ငွေ {amount} ထည့်ပြီး · {category}။ ဒီလ လက်ကျန်: {left}။",
  },
  "bot.addAmount": {
    en: 'Got it — but how much? e.g. "add expense 5000 lunch" ✍️',
    my: 'ရပါပြီ — ဘယ်လောက်လဲ? ဥပမာ "ထွက်ငွေ ၅,၀၀၀ ထည့်ပါ" ✍️',
  },
  "bot.txCount": {
    en: "🧾 You have {count} transactions recorded this month.",
    my: "🧾 ဒီလ မှတ်တမ်း {count} ခု ရှိသည်။",
  },
  "bot.thanks": {
    en: "Anytime! 💚 Keep me posted on your spending.",
    my: "အချိန်မရွေးပါ 💚 အသုံးစရိတ်များကို ဆက်လက်မှတ်တမ်းတင်ထားပါ။",
  },
} as const;

export type TKey = keyof typeof DICT;

/** Translate a key, replacing {placeholders} from `params`. */
export const translate = t;
export { t as translateKey };

/** Translate a key, replacing {placeholders} from `params`. */
export function t(
  lang: Lang,
  key: TKey,
  params?: Record<string, string | number>,
): string {
  const entry = DICT[key] as Entry | undefined;
  let str = entry ? entry[lang] : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

/** Category labels for display (translated) */
const CATEGORY_LABELS: Record<string, Entry> = {
  Food: { en: "Food", my: "အစားအသောက်" },
  Transport: { en: "Transport", my: "သယ်ယူပို့ဆောင်ရေး" },
  Shopping: { en: "Shopping", my: "ဈေးဝယ်ခြင်း" },
  Bills: { en: "Bills", my: "ငွေတောင်းခံလွှာများ" },
  Health: { en: "Health", my: "ကျန်းမာရေး" },
  Fun: { en: "Fun", my: "အပန်းဖြေမှု" },
  Education: { en: "Education", my: "ပညာရေး" },
  Salary: { en: "Salary", my: "လစာ" },
  Freelance: { en: "Freelance", my: "အလွတ်တန်းအလုပ်" },
  Bonus: { en: "Bonus", my: "ဆုကြေး" },
  Gift: { en: "Gift", my: "လက်ဆောင်" },
  Other: { en: "Other", my: "အခြား" },
};

export function categoryLabel(lang: Lang, category: string): string {
  const entry = CATEGORY_LABELS[category];
  return entry ? entry[lang] : category;
}

/* ---- Month names (English / Burmese) ---- */
export const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTHS_MY = [
  "ဇန်မောက်ဝါရီ",
  "ဖေဖော်ဝါရီ",
  "မတ်",
  "ဧပြီ",
  "မေ",
  "ဇွန်",
  "ဇူလိုင်",
  "ဩဂုတ်",
  "စက်တင်ဘာ",
  "အောက်တိုဘာ",
  "နိုဝင်ဘာ",
  "ဒီဇင်ဘာ",
];

export function monthLabel(month: string, lang: Lang): string {
  const m = Number(month.slice(5, 7));
  if (Number.isNaN(m) || m < 1 || m > 12) return month;
  return lang === "my"
    ? MONTHS_MY[m - 1]
    : `${MONTHS_EN[m - 1]} ${month.slice(0, 4)}`;
}
