# Expense Tracker 💰

A compact, digital-wallet style expense tracker with a built-in chatbot, built with
**Expo SDK 54 + NativeWind v5 (Tailwind v4) + expo-router v6 + expo-sqlite**.

All data is stored locally on your device in a SQLite database — no server, no API,
no accounts, no internet required.

## Features

- 📱 **Wallet home** — gradient balance card, income/spent/left tiles, today's spending, recent activity
- ➕ **Add income & expenses** — categories with emoji, notes, date picker, optional "set as monthly fixed salary"
- 📊 **History** — month switcher, budget-used progress, daily expense chart, category breakdown, grouped transactions
- 🤖 **Chatbot** — ask about your money in plain English (works fully offline):
  - "How much did I spend today / this week / this month?"
  - "Income this month?", "How much budget left?"
  - "Spent on food this month?", "What's my biggest expense?"
  - "Summary", "Add expense 5k lunch", "Add income 3k freelance"
- 🌗 **Dark / light / system theme** via NativeWind

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android/iOS) or press `w` for web.

## Project structure

```
app/              screens (tabs: wallet, history, chat, settings + add modal)
components/       WalletCard, TransactionRow, DailyBars, BarRow, StatTile…
lib/              db (SQLite), wallet data layer, chatbot engine, money/dates/categories
store/            React context (state + actions)
```

## Chatbot examples

| You ask | Bot |
| --- | --- |
| "how much did I spend today?" | today's total + budget left |
| "spent on food this month" | food total + % of expenses |
| "budget left" | left, spent, daily allowance |
| "biggest expense" | largest single expense |
| "add expense 2k taxi yesterday" | records it instantly |
