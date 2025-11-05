# 📱 SlipWise – AI-Powered Expense Tracker

**SlipWise** is a smart, AI-powered expense tracking mobile application built with **React Native (Expo)**.
It automatically scans your receipts, extracts key information like **total, vendor, and tax**, and helps you stay on top of your finances — all from your pocket.

SlipWise focuses on **simplicity**, **offline-first experience**, and **AI-driven automation** for effortless daily expense management.

---

## 🌟 Key Features

### 🧾 **Receipt Scanning (OCR AI)**

- Capture or upload a shopping receipt directly from your phone.
- Uses **Tesseract OCR** for offline text extraction (no paid API).
- Auto-detects:

  - Total amount
  - Date and time
  - Vendor name
  - Tax/VAT percentage

- Smart text parsing with regular expressions.
- Manual editing option for accuracy.

---

### 💰 **Expense Management**

- Add, edit, and delete expenses easily.
- Automatically categorize expenses using AI keyword mapping:

  - 🍔 Food & Dining
  - 🚗 Transportation
  - 🛍️ Shopping
  - 💡 Utilities
  - ❤️ Healthcare
  - 📚 Education
  - 🎮 Entertainment

- Attach receipts or notes to each expense.

---

### 📊 **Analytics Dashboard**

- View monthly spending summaries.
- Visual breakdown of expenses per category.
- Trend charts for better financial insights.
- Smart budget tips based on spending patterns.
- Top vendor and highest category reports.

---

### 🔔 **Notifications & Reminders**

- Daily reminder to log expenses at a specific time.
- Weekly summary notifications (optional).
- Customizable reminder times.
- Powered by **Expo Notifications** and local storage.

---

### 🗄️ **Offline-First Sync**

- Works completely offline with **AsyncStorage** or **SQLite**.
- Automatically syncs to cloud backend when online.
- Secure data storage and conflict resolution.
- Backup and restore functionality planned for next release.

---

### 🔐 **Security**

- Biometric authentication (Face ID / Touch ID).
- Local data encryption for sensitive information.
- Session lock after inactivity.
- Configurable PIN or biometric-only unlock.

---

## ⚙️ Tech Stack

| Layer            | Technology                                 |
| ---------------- | ------------------------------------------ |
| Framework        | **React Native (Expo SDK 54+)**            |
| State Management | Zustand or Redux Toolkit                   |
| Storage          | AsyncStorage / SQLite                      |
| OCR              | Tesseract.js (via Expo FileSystem)         |
| Navigation       | React Navigation 6                         |
| Charts           | React Native Chart Kit                     |
| Authentication   | Expo Local Authentication (biometrics)     |
| Notifications    | Expo Notifications                         |
| Styling          | Tailwind (NativeWind) or Styled Components |
| Future Backend   | NestJS + Prisma + MongoDB (microservices)  |

---

## 🏗️ App Architecture

````
mobile/
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/            # App screens (Home, AddExpense, Analytics, etc.)
│   ├── navigation/         # React Navigation setup
│   ├── services/           # API, OCR, and storage logic
│   ├── hooks/              # Reusable custom hooks
# 📱 SlipWise – Mobile (MVP)

This is the mobile app for SlipWise, a minimal Expo-based MVP focused on core expense capture and OCR extraction.

This repository contains a minimal mobile UI that communicates with the local Node.js backend in this workspace. The mobile app is intentionally small: only screens, a few components, and services required for the MVP remain active. Non-essential files were moved to a backup folder (see "Pruning" below).

## What this mobile README covers

- How to run the mobile app locally
- How the app talks to the backend (API_URL)
- Where pruned files were backed up
- A short reference of the app structure and core modules

---

## Quickstart (development)

Prerequisites

- Node.js 18+
- Expo CLI (optional but recommended): `npm install -g expo-cli`

Run the app

1. Install dependencies

```bash
cd mobile
npm install
````

2. Configure environment

- The repo root includes `.env.example` with shared variables. For local development you can create a `.env` file in the project root or configure environment variables in your shell. Important values:
  - API_URL — URL of the SlipWise server (e.g. http://10.0.0.2:4000 or http://localhost:4000 for emulator)

Example (macOS / Linux):

```bash
export API_URL=http://localhost:4000
```

3. Start the Expo dev server

```bash
cd mobile
npm run start
# or
expo start
```

Run on device/emulator using the Expo UI (press `a` for Android, `i` for iOS, `w` for web).

Notes on API_URL and emulators

- If you run the mobile app on a physical device, replace `localhost` with the host machine IP reachable from the device (for example `http://192.168.1.100:4000`).
- Android emulators may require special hostnames (e.g., `10.0.2.2` for Android emulator).

---

## Project structure (active files)

- `mobile/app/` — Expo Router screens (home, add)
- `mobile/components/` — minimal UI components (ExpenseItem, Themed, hooks)
- `mobile/assets/` — fonts and images used by the app
- `mobile/services/` — API and storage logic (network-first with local fallback)
- `mobile/package.json`, `mobile/tsconfig.json`, `mobile/app.json`

Pruned files (backed up)

- Non-essential components and tests were moved to `mobile/backup-<timestamp>/` during pruning. If you need any of the removed files, restore them from that backup directory.

---

## Core modules (short)

- OCR: Tesseract.js (via the server OCR endpoint) — the app uploads receipts to the backend `/ocr` and receives extracted text.
- Expense service: network-first calls to `${API_URL}/expenses` with AsyncStorage fallback when offline.

---

## Troubleshooting

- If the app cannot reach the backend, confirm `API_URL` is set and the server is running (`server` in this workspace runs on port 4000 by default).
- If fonts or assets don't load, run `expo start -c` to clear Metro cache.

---

## License

Apache-2.0
