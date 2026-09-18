import { I18nManager, NativeModules, Platform } from "react-native";
import type { LanguageMode } from "./types";

/* ------------------------------------------------------------------ */
/* Language: Myanmar Burmese (my) / English                          */
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
  "tab.wallet": {
    en: "Wallet",
    my: "ပိုက်ဆံအိတ်",
  },

  "tab.history": {
    en: "History",
    my: "မှတ်တမ်း",
  },

  "tab.report": {
    en: "Report",
    my: "အစီရင်ခံစာ",
  },

  "tab.chat": {
    en: "Chat",
    my: "စကားပြော",
  },

  "tab.settings": {
    en: "Settings",
    my: "ဆက်တင်များ",
  },

  /* ---- Home ------------------------------------------------------ */
  "greeting.morning": {
    en: "Good morning",
    my: "မင်္ဂလာနံနက်ခင်းပါ",
  },

  "greeting.afternoon": {
    en: "Good afternoon",
    my: "မင်္ဂလာနေ့လယ်ခင်းပါ",
  },

  "greeting.evening": {
    en: "Good evening",
    my: "မင်္ဂလာညနေခင်းပါ",
  },

  "wallet.mine": {
    en: "{name}'s Wallet",
    my: "{name} ရဲ့ ပိုက်ဆံအိတ်",
  },

  "wallet.generic": {
    en: "My Wallet",
    my: "ကျွန်ုပ်ရဲ့ ပိုက်ဆံအိတ်",
  },

  "action.expense": {
    en: "Expense",
    my: "ထွက်ငွေ",
  },

  "action.income": {
    en: "Income",
    my: "ဝင်ငွေ",
  },

  "tile.totalIncome": {
    en: "Total income",
    my: "စုစုပေါင်း ဝင်ငွေ",
  },

  "tile.today": {
    en: "Today",
    my: "ဒီနေ့",
  },

  "tile.spent": {
    en: "Spent",
    my: "သုံးစွဲငွေ",
  },

  "tile.budgetLeft": {
    en: "Budget left",
    my: "လက်ကျန်ဘတ်ဂျက်",
  },

  "tile.totalExpense": {
    en: "Total expense",
    my: "စုစုပေါင်း ထွက်ငွေ",
  },

  "home.recent": {
    en: "Recent activity",
    my: "လတ်တလော လုပ်ဆောင်ချက်များ",
  },

  "home.seeAll": {
    en: "See all",
    my: "အားလုံးကြည့်ရန်",
  },

  "empty.noTx.title": {
    en: "No transactions yet",
    my: "မှတ်တမ်း မရှိသေးပါ",
  },

  "empty.noTx.sub": {
    en: "Tap + Expense or + Income to get started",
    my: "စတင်ရန် + ထွက်ငွေ သို့မဟုတ် + ဝင်ငွေကို နှိပ်ပါ",
  },

  /* ---- Wallet card ----------------------------------------------- */
  "card.available": {
    en: "Available budget",
    my: "အသုံးပြုနိုင်သော ဘတ်ဂျက်",
  },

  "card.daysLeft": {
    en: "{days}d left",
    my: "{days} ရက် ကျန်",
  },

  "card.overBudget": {
    en: "⚠️ Over budget this month",
    my: "⚠️ ဒီလ ဘတ်ဂျက်ထက် ပိုသုံးထားပါတယ်",
  },

  "card.perDay": {
    en: "≈ {amount} / day allowed",
    my: "≈ တစ်ရက်လျှင် {amount} အထိ သုံးနိုင်ပါတယ်",
  },

  "card.fixed": {
    en: "{amount} fixed",
    my: "{amount} ပုံသေ",
  },

  /* ---- Add screen ------------------------------------------------ */
  "add.title": {
    en: "New transaction",
    my: "မှတ်တမ်းအသစ်",
  },

  /* ---- Add Transaction ------------------------------------------- */
  "add.expense": {
    en: "Expense",
    my: "ထွက်ငွေ",
  },

  "add.income": {
    en: "Income",
    my: "ဝင်ငွေ",
  },

  "add.amount": {
    en: "Amount",
    my: "ပမာဏ",
  },

  "add.category": {
    en: "Category",
    my: "အမျိုးအစား",
  },

  "add.note": {
    en: "Note (optional)",
    my: "မှတ်ချက် (မဖြည့်လည်းရ)",
  },

  "add.notePlaceholder": {
    en: "e.g. lunch with team",
    my: "ဥပမာ - အဖွဲ့နဲ့အတူ နေ့လယ်စာစား",
  },

  "add.today": {
    en: "Today",
    my: "ဒီနေ့",
  },

  "add.yesterday": {
    en: "Yesterday",
    my: "မနေ့က",
  },

  "add.pickDate": {
    en: "Pick date",
    my: "ရက်စွဲရွေးရန်",
  },

  "add.fixedSalary": {
    en: "Set as monthly fixed salary",
    my: "လစဉ် ပုံသေလစာအဖြစ် သတ်မှတ်ရန်",
  },

  "add.fixedSalaryHint": {
    en: "Applies this amount to every month as your baseline income.",
    my: "ဤပမာဏကို လစဉ် အခြေခံဝင်ငွေအဖြစ် သတ်မှတ်အသုံးပြုပါမည်။",
  },

  "add.addIncome": {
    en: "Add income",
    my: "ဝင်ငွေထည့်ရန်",
  },

  "add.addExpense": {
    en: "Add expense",
    my: "ထွက်ငွေထည့်ရန်",
  },

  "add.saving": {
    en: "Saving…",
    my: "သိမ်းဆည်းနေပါသည်…",
  },

  "add.date": {
    en: "Date",
    my: "ရက်စွဲ",
  },

  /* ---- Onboarding ------------------------------------------------ */
  "onb.title": {
    en: "Welcome to your wallet",
    my: "သင့်ပိုက်ဆံအိတ်အက်ပ်မှ ကြိုဆိုပါတယ်",
  },

  "onb.sub": {
    en: "What should we call you? Your name tells us whose wallet this is.",
    my: "သင့်ကို ဘယ်လိုခေါ်ရမလဲ။ ဒီပိုက်ဆံအိတ်ကို ဘယ်သူအသုံးပြုနေလဲ သိနိုင်ဖို့ သင့်အမည်ကို အသုံးပြုပါမယ်။",
  },

  "onb.namePlaceholder": {
    en: "Your name",
    my: "သင့်အမည်",
  },

  "onb.continue": {
    en: "Continue",
    my: "ဆက်လက်ရန်",
  },

  "onb.privacy": {
    en: "Your data stays on your device",
    my: "သင့်ဒေတာများကို သင့်စက်ထဲတွင်သာ သိမ်းဆည်းထားပါသည်",
  },

  /* ---- Settings -------------------------------------------------- */
  "set.title": {
    en: "Settings",
    my: "ဆက်တင်များ",
  },

  "set.profile": {
    en: "Profile",
    my: "ပရိုဖိုင်",
  },

  "set.name": {
    en: "Your name",
    my: "သင့်အမည်",
  },

  "set.nameHint": {
    en: "This wallet belongs to {name} · saved automatically",
    my: "{name} ရဲ့ ပိုက်ဆံအိတ် · အလိုအလျောက် သိမ်းဆည်းထားပါတယ်",
  },

  "set.appearance": {
    en: "Appearance",
    my: "အသွင်အပြင်",
  },

  "set.language": {
    en: "Language",
    my: "ဘာသာစကား",
  },

  "set.langHint": {
    en: "System",
    my: "စနစ်အတိုင်း",
  },

  "set.langMy": {
    en: "Myanmar",
    my: "မြန်မာဘာသာ",
  },

  "set.langEn": {
    en: "English",
    my: "အင်္ဂလိပ်ဘာသာ",
  },

  "theme.system": {
    en: "System",
    my: "စနစ်အတိုင်း",
  },

  "theme.light": {
    en: "Light",
    my: "အလင်းမုဒ်",
  },

  "theme.dark": {
    en: "Dark",
    my: "အမှောင်မုဒ်",
  },

  "set.money": {
    en: "Money",
    my: "ငွေကြေး",
  },

  "set.currency": {
    en: "Currency symbol",
    my: "ငွေကြေးသင်္ကေတ",
  },

  "set.salary": {
    en: "Monthly fixed income (salary)",
    my: "လစဉ် ပုံသေဝင်ငွေ (လစာ)",
  },

  "set.moneyHint": {
    en: "Counted as income for every month. Extra income can be added per transaction.",
    my: "လတိုင်း ဝင်ငွေအဖြစ် ရေတွက်ပါမည်။ အပိုဝင်ငွေများကို မှတ်တမ်းတစ်ခုချင်းစီအလိုက် ထည့်နိုင်ပါတယ်။",
  },

  "set.data": {
    en: "Data",
    my: "ဒေတာ",
  },

  "set.reset": {
    en: "Reset all data",
    my: "ဒေတာအားလုံး ဖျက်ရန်",
  },

  "set.resetMsg": {
    en: "Deletes your name, budget and every transaction (income, expense, history). You'll set up your profile again. This can't be undone.",
    my: "သင့်အမည်၊ ဘတ်ဂျက်နှင့် ဝင်ငွေ၊ ထွက်ငွေ၊ မှတ်တမ်းအားလုံးကို ဖျက်ပစ်ပါမည်။ ထို့နောက် ပရိုဖိုင်ကို ပြန်လည်သတ်မှတ်ရပါမည်။ ဖျက်ပြီးပါက ပြန်လည်ရယူ၍ မရနိုင်ပါ။",
  },

  "set.footer": {
    en: "Expense Tracker · ",
    my: "အသုံးစရိတ်မှတ်တမ်း · ",
  },

  "alert.cancel": {
    en: "Cancel",
    my: "မလုပ်တော့ပါ",
  },

  "alert.delete": {
    en: "Delete",
    my: "ဖျက်မည်",
  },

  "alert.reset": {
    en: "Reset",
    my: "ပြန်လည်သတ်မှတ်မည်",
  },

  "alert.delTxTitle": {
    en: "Delete transaction",
    my: "မှတ်တမ်းကို ဖျက်မလား?",
  },

  "alert.delTxMsg": {
    en: "This can't be undone.",
    my: "ဖျက်ပြီးပါက ပြန်လည်ရယူ၍ မရနိုင်ပါ။",
  },

  /* ---- History --------------------------------------------------- */
  "his.title": {
    en: "History",
    my: "မှတ်တမ်း",
  },

  "his.dailyExpenses": {
    en: "Daily expenses",
    my: "နေ့စဉ် ထွက်ငွေများ",
  },

  "his.byCategory": {
    en: "Spending by category",
    my: "အမျိုးအစားအလိုက် အသုံးစရိတ်",
  },

  "his.transactions": {
    en: "Transactions",
    my: "မှတ်တမ်းများ",
  },

  "his.noExpenses": {
    en: "No expenses this month yet.",
    my: "ဒီလအတွက် ထွက်ငွေမှတ်တမ်း မရှိသေးပါ။",
  },

  "his.empty.title": {
    en: "Nothing recorded this month",
    my: "ဒီလအတွက် မှတ်တမ်းမရှိသေးပါ",
  },

  "his.empty.sub": {
    en: "Switch months or add something with the + button",
    my: "အခြားလကို ရွေးကြည့်ပါ သို့မဟုတ် + ခလုတ်ကိုနှိပ်ပြီး မှတ်တမ်းထည့်ပါ",
  },

  "his.loading": {
    en: "Loading…",
    my: "တင်နေပါသည်…",
  },

  "his.ofIncome": {
    en: "of income",
    my: "ဝင်ငွေ၏",
  },

  /* ---- Report tab ------------------------------------------------ */
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
    my: "ဖိုင်ထုတ်ယူမှု မအောင်မြင်ပါ",
  },

  "report.cancelExport": {
    en: "Cancel",
    my: "မလုပ်တော့ပါ",
  },

  "report.savedTo": {
    en: "Saved to device:\n{path}",
    my: "စက်ထဲတွင် သိမ်းဆည်းပြီးပါပြီ။\n{path}",
  },

  "report.exportHint": {
    en: "Export this month's data as TXT or CSV",
    my: "ဒီလအတွက် အချက်အလက်များကို TXT သို့မဟုတ် CSV ဖိုင်အဖြစ် ထုတ်ယူနိုင်ပါတယ်",
  },

  "report.noTransactions": {
    en: "No transactions this month",
    my: "ဒီလအတွက် မှတ်တမ်းမရှိပါ",
  },

  "report.dailyExpenses": {
    en: "Daily expenses",
    my: "နေ့စဉ် ထွက်ငွေများ",
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
    my: "ဝင်ငွေမှတ်တမ်း မရှိပါ",
  },

  "report.emptyExpense": {
    en: "No expenses recorded",
    my: "ထွက်ငွေမှတ်တမ်း မရှိပါ",
  },

  /* ---- Chat ------------------------------------------------------ */
  "chat.assistant": {
    en: "Financial Manager",
    my: "ငွေကြေးစီမံခန့်ခွဲသူ",
  },

  "chat.online": {
    en: "online",
    my: "အွန်လိုင်း",
  },

  "chat.typing": {
    en: "typing…",
    my: "ရိုက်နေပါသည်…",
  },

  "chat.placeholder": {
    en: "Ask about your money…",
    my: "သင့်ငွေကြေးအကြောင်း မေးမြန်းပါ…",
  },

  "sug.today": {
    en: "Spent today?",
    my: "ဒီနေ့ ဘယ်လောက်သုံးထားလဲ?",
  },

  "sug.incomeMonth": {
    en: "Income this month",
    my: "ဒီလ ဝင်ငွေ",
  },

  "sug.budgetLeft": {
    en: "Budget left",
    my: "လက်ကျန်ဘတ်ဂျက်",
  },

  "sug.summary": {
    en: "Summary",
    my: "အနှစ်ချုပ်",
  },

  "sug.addExpense": {
    en: "Add expense 5k lunch",
    my: "နေ့လယ်စာအတွက် ၅,၀၀၀ ကျပ် ထွက်ငွေထည့်ပါ",
  },

  /* ---- Bot replies (plain words reused inside templates) ---------- */
  "bot.income": {
    en: "Income",
    my: "ဝင်ငွေ",
  },

  "bot.expenses": {
    en: "Expenses",
    my: "ထွက်ငွေ",
  },

  "bot.budgetLeft": {
    en: "Budget left",
    my: "လက်ကျန်ဘတ်ဂျက်",
  },

  "bot.spentWord": {
    en: "spent",
    my: "သုံးထားသည်",
  },

  "bot.fixedSalary": {
    en: "fixed salary",
    my: "ပုံသေလစာ",
  },

  "bot.extra": {
    en: "extra",
    my: "အပို",
  },

  "bot.total": {
    en: "total",
    my: "စုစုပေါင်း",
  },

  "bot.overview": {
    en: "overview",
    my: "အနှစ်ချုပ်",
  },

  "bot.todayWord": {
    en: "today",
    my: "ဒီနေ့",
  },

  "bot.yesterdayWord": {
    en: "yesterday",
    my: "မနေ့က",
  },

  "bot.thisWeek": {
    en: "this week",
    my: "ဒီအပတ်",
  },

  "bot.lastWeek": {
    en: "last week",
    my: "ပြီးခဲ့တဲ့အပတ်",
  },

  "bot.thisMonth": {
    en: "this month",
    my: "ဒီလ",
  },

  "bot.lastMonth": {
    en: "Last month",
    my: "ပြီးခဲ့တဲ့လ",
  },

  "bot.daysUnit": {
    en: "days",
    my: "ရက်",
  },

  "bot.dailyAllowance": {
    en: "Daily allowance: ~{amount} · {days} days left",
    my: "တစ်ရက် အသုံးပြုနိုင်ငွေ ~{amount} · {days} ရက် ကျန်",
  },

  "bot.overMood": {
    en: "⚠️ You're over budget — time to slow down!",
    my: "⚠️ ဘတ်ဂျက်ထက် ပိုသုံးထားပါတယ် — အသုံးစရိတ်ကို နည်းနည်းလျှော့ကြည့်ပါ!",
  },

  "bot.welcome": {
    en: "Hi! I'm your financial manager 🤖 \nAsk me things like:\n• 'How much did I spend today?'\n• 'How much budget left?'\n• 'Income this month?'\n• 'Add expense 5k lunch'\nType 'help' for the full list.",

    my: 'မင်္ဂလာပါ။ ကျွန်ုပ်က သင့်ငွေကြေးစီမံခန့်ခွဲသူပါ 🤖\nအောက်ပါမေးခွန်းများကို မေးနိုင်ပါတယ်:\n• "ဒီနေ့ ဘယ်လောက်သုံးထားလဲ?"\n• "လက်ကျန်ဘတ်ဂျက် ဘယ်လောက်ရှိလဲ?"\n• "ဒီလ ဝင်ငွေ ဘယ်လောက်ရှိလဲ?"\n• "နေ့လယ်စာအတွက် ၅,၀၀၀ ကျပ် ထွက်ငွေထည့်"\nလုပ်ဆောင်နိုင်တာအားလုံးကို ကြည့်ရန် "help" ဟု ရိုက်ပါ။',
  },

  "bot.help": {
    en: "I'm your financial manager 🤖 Ask me things like:\n\n📉 'How much did I spend today / this month?'\n📈 'Income this month?' · 'How much did I earn today?'\n💰 'How much budget left?' · 'What's my balance?'\n🍔 'How much did I spend on food this month?'\n🏆 'What's my biggest expense?'\n🧾 'Summary' · 'Overview'\n✍️ 'Add expense 5000 lunch'",

    my: 'ကျွန်ုပ်က သင့်ငွေကြေးစီမံခန့်ခွဲသူပါ 🤖 အောက်ပါအကြောင်းအရာများကို မေးနိုင်ပါတယ်:\n\n📉 "ဒီနေ့ / ဒီလ ဘယ်လောက်သုံးထားလဲ?"\n📈 "ဒီလ ဝင်ငွေ ဘယ်လောက်ရှိလဲ?" · "ဒီနေ့ ဝင်ငွေ ဘယ်လောက်ရခဲ့လဲ?"\n💰 "လက်ကျန်ဘတ်ဂျက် ဘယ်လောက်ရှိလဲ?" · "လက်ကျန်ငွေ ဘယ်လောက်ရှိလဲ?"\n🍔 "ဒီလ အစားအသောက်အတွက် ဘယ်လောက်သုံးထားလဲ?"\n🏆 "ဒီလ အကြီးဆုံးထွက်ငွေက ဘာလဲ?"\n🧾 "အနှစ်ချုပ်" · "အခြေအနေအနှစ်ချုပ်"\n✍️ "နေ့လယ်စာအတွက် ၅,၀၀၀ ကျပ် ထွက်ငွေထည့်"',
  },

  "bot.fallback": {
    en: "Hmm, I didn't quite get that 🤔 Try one of these:\n• 'How much did I spend this month?'\n• 'Income this month?'\n• 'How much left?'\n• 'Spent on food?'\n• 'Add expense 5k coffee'\n\nType 'help' to see everything I can do.",

    my: 'ဟုတ်ကဲ့၊ မေးခွန်းကို အတိအကျ နားမလည်သေးပါ 🤔 အောက်ပါမေးခွန်းတွေထဲက တစ်ခုကို စမ်းကြည့်ပါ:\n• "ဒီလ ဘယ်လောက်သုံးထားလဲ?"\n• "ဒီလ ဝင်ငွေ ဘယ်လောက်ရှိလဲ?"\n• "ဘယ်လောက်ကျန်လဲ?"\n• "အစားအသောက်အတွက် ဘယ်လောက်သုံးထားလဲ?"\n• "ကော်ဖီအတွက် ၅,၀၀၀ ကျပ် ထွက်ငွေထည့်"\n\nလုပ်ဆောင်နိုင်တာအားလုံးကို ကြည့်ရန် "help" ဟု ရိုက်ပါ။',
  },

  "bot.greetingLine": {
    en: "👋 I can tell you your spending, income, and budget left.",
    my: "👋 သင့်အသုံးစရိတ်၊ ဝင်ငွေနဲ့ လက်ကျန်ဘတ်ဂျက်ကို ပြောပြနိုင်ပါတယ်။",
  },

  "bot.summaryLine": {
    en: "📊 {month} overview\nIncome: {income}\nExpenses: {expense}\nBudget left: {left}",

    my: "📊 {month} အနှစ်ချုပ်\nဝင်ငွေ: {income}\nထွက်ငွေ: {expense}\nလက်ကျန်ဘတ်ဂျက်: {left}",
  },

  "bot.leftLine": {
    en: "💰 Budget left this month: {left} out of {total}.\nYou've spent {spent} so far.",

    my: "💰 ဒီလ ဘတ်ဂျက်လက်ကျန်: {left} / {total}။\nအခုအချိန်ထိ {spent} သုံးထားပါတယ်။",
  },

  "bot.leftLineMonth": {
    en: "💰 Budget left {month}: {left} out of {total}.\nYou've spent {spent} in this period.",

    my: "💰 {month} ဘတ်ဂျက်လက်ကျန်: {left} / {total}။\nဒီကာလအတွင်း {spent} သုံးထားပါတယ်။",
  },

  "bot.leftLineLastMonth": {
    en: "💰 Budget left last month ({month}): {left} out of {total}.\nYou've spent {spent} last month.",

    my: "💰 ပြီးခဲ့တဲ့လ ({month}) ဘတ်ဂျက်လက်ကျန်: {left} / {total}။\nပြီးခဲ့တဲ့လမှာ {spent} သုံးထားပါတယ်။",
  },

  "bot.spentLine": {
    en: "{period}: {amount} spent. Left in budget: {left}.",
    my: "{period}: {amount} သုံးထားပါတယ်။ ဘတ်ဂျက်လက်ကျန်: {left}။",
  },

  "bot.biggestLine": {
    en: "🏆 Biggest expense this month: {amount} · {category} · {date}",
    my: "🏆 ဒီလ အကြီးဆုံးထွက်ငွေ: {amount} · {category} · {date}",
  },

  "bot.noExpenses": {
    en: "No expenses recorded yet this month 🎉",
    my: "ဒီလ ထွက်ငွေမှတ်တမ်း မရှိသေးပါ 🎉",
  },

  "bot.catMonth": {
    en: "{category} spending this month: {amount} ({pct}% of your expenses).",
    my: "ဒီလ {category} အတွက် အသုံးစရိတ်: {amount} (စုစုပေါင်းထွက်ငွေရဲ့ {pct}%)။",
  },

  "bot.catNone": {
    en: "No {category} spending recorded this month ✨",
    my: "ဒီလ {category} အတွက် အသုံးစရိတ်မှတ်တမ်း မရှိပါ ✨",
  },

  "bot.catOtherTf": {
    en: "You've spent {amount} {period} in total. For category breakdowns I look at the whole month 🙂",

    my: "{period} အတွင်း စုစုပေါင်း {amount} သုံးထားပါတယ်။ အမျိုးအစားအလိုက် ခွဲခြမ်းကြည့်တဲ့အခါ ဒီလတစ်လစာ မှတ်တမ်းကို အသုံးပြုပါတယ် 🙂",
  },

  "bot.incomeFixed": {
    en: "Your fixed monthly salary is {amount} 💼 (set it in Settings).",

    my: "သင့်လစဉ် ပုံသေလစာက {amount} ဖြစ်ပါတယ် 💼 (ဆက်တင်များတွင် သတ်မှတ်နိုင်ပါတယ်)။",
  },

  "bot.incomeMonth": {
    en: "📈 {month} income: {amount} ({fixed} {fixedWord} + {extra} {extraWord}).",

    my: "📈 {month} ဝင်ငွေ: {amount} ({fixed} {fixedWord} + {extra} {extraWord})။",
  },

  "bot.incomeLast": {
    en: "Last month income: {amount} 💰",
    my: "ပြီးခဲ့တဲ့လ ဝင်ငွေ: {amount} 💰",
  },

  "bot.incomeToday": {
    en: "Income tracking is monthly — I don't break down daily/weekly income. {month} income so far: {amount} 💰",

    my: "ဝင်ငွေကို လစဉ်အလိုက်သာ မှတ်တမ်းတင်ထားပါတယ် — နေ့စဉ် ဒါမှမဟုတ် အပတ်စဉ်အလိုက် ခွဲမပြထားပါဘူး။ {month} အတွက် လက်ရှိဝင်ငွေ: {amount} 💰",
  },

  "bot.addedIncome": {
    en: "✅ Added income {amount} · {category}.",
    my: "✅ ဝင်ငွေ {amount} · {category} ကို ထည့်ပြီးပါပြီ။",
  },

  "bot.addedExpense": {
    en: "✅ Added expense {amount} · {category}. Left this month: {left}.",

    my: "✅ ထွက်ငွေ {amount} · {category} ကို ထည့်ပြီးပါပြီ။ ဒီလ ဘတ်ဂျက်လက်ကျန်: {left}။",
  },

  "bot.addAmount": {
    en: 'Got it — but how much? e.g. "add expense 5000 lunch" ✍️',

    my: 'ဟုတ်ကဲ့ — ဘယ်လောက်သုံးခဲ့လဲ? ဥပမာ "နေ့လယ်စာအတွက် ၅,၀၀၀ ကျပ် ထွက်ငွေထည့်" ✍️',
  },

  "bot.txCount": {
    en: "🧾 You have {count} transactions recorded this month.",

    my: "🧾 ဒီလအတွက် မှတ်တမ်း {count} ခု ရှိပါတယ်။",
  },

  "bot.thanks": {
    en: "Anytime! 💚 Keep me posted on your spending.",
    my: "ရပါတယ် 💚 သင့်အသုံးစရိတ်တွေကို ဆက်လက်မှတ်တမ်းတင်ထားပေးနော်။",
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
  Food: {
    en: "Food",
    my: "အစားအသောက်",
  },

  Transport: {
    en: "Transport",
    my: "သယ်ယူပို့ဆောင်ရေး",
  },

  Shopping: {
    en: "Shopping",
    my: "ဈေးဝယ်ခြင်း",
  },

  Bills: {
    en: "Bills",
    my: "ငွေတောင်းခံလွှာများ",
  },

  Health: {
    en: "Health",
    my: "ကျန်းမာရေး",
  },

  Fun: {
    en: "Fun",
    my: "အပန်းဖြေမှု",
  },

  Education: {
    en: "Education",
    my: "ပညာရေး",
  },

  Salary: {
    en: "Salary",
    my: "လစာ",
  },

  Freelance: {
    en: "Freelance",
    my: "အလွတ်တန်းအလုပ်",
  },

  Bonus: {
    en: "Bonus",
    my: "ဆုကြေး",
  },

  Gift: {
    en: "Gift",
    my: "လက်ဆောင်",
  },

  Other: {
    en: "Other",
    my: "အခြား",
  },
};

export function categoryLabel(lang: Lang, category: string): string {
  const entry = CATEGORY_LABELS[category];
  return entry ? entry[lang] : category;
}

/* ---- Month names (English / Burmese) ---------------------------- */
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
  "ဇန်နဝါရီ",
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
