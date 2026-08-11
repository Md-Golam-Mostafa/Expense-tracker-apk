# Expense Tracker 💰

A clean, offline-first expense & income tracker built with **React Native**.

- Track expenses & income with categories (Food, Transport, Salary, Freelance, …)
- Monthly summary with balance, income & expense breakdown
- Month-by-month navigation, per-day transaction history
- Data saved locally on the device (AsyncStorage) — no internet needed
- **৳ BDT** currency formatting, light & dark mode support

## Features

| Screen / Component | What it does |
| --- | --- |
| Home dashboard | Monthly balance card, income/expense stats, date-grouped transaction list |
| Add Transaction | Expense/Income toggle, amount, category grid, date picker, optional note |
| Delete | Tap a transaction to delete it (with confirmation) |
| Persistence | All data stored locally via AsyncStorage |

## Project structure

```
App.tsx                    — main screen (dashboard, list, FAB, modal wiring)
src/
  components/              — SummaryCard, TransactionItem, AddTransactionModal
  constants.ts             — categories (expense + income)
  storage.ts               — AsyncStorage load/save
  theme.ts                 — light/dark theme colors
  types.ts                 — Transaction & Category types
  utils.ts                 — BDT formatting, date helpers, summaries
```

## Build the Android APK

Requirements: Node 22+, JDK 17, Android SDK (set `ANDROID_HOME`).

> **⚠️ Important for this machine:** the `C:` drive is 100% full, so Gradle
> cannot use the default cache location on `C:`. Point `GRADLE_USER_HOME` to
> the copy on `E:` (already created) or the build will fail with
> *"There is not enough space on the disk"*.

```sh
# 1. Install JS dependencies (once)
npm install

# 2. Build the release APK (from the project root)
cd android && GRADLE_USER_HOME=/e/.gradle ./gradlew assembleRelease
```

The signed APK is written to:

```
android/app/build/outputs/apk/release/app-release.apk
```

Install it on a connected device (or emulator):

```sh
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Run in development

```sh
npm start          # start Metro
npm run android    # build & run on device/emulator (another terminal)
```

## Tests

```sh
npm test           # Jest
npx tsc --noEmit   # TypeScript check
npm run lint       # ESLint
```
