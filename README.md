# SlipWise — Expense Tracker (Monorepo)

This repository contains two main parts:

- `server/` — Node.js backend (Express + Prisma + MongoDB) providing expenses CRUD and OCR endpoints.
- `mobile/` — Expo (React Native) mobile app (MVP) that uploads receipts, uses the server OCR, and stores expenses locally when offline.

This README summarizes how to run the project locally and where to look for important files.

---

## Quickstart (development)

1) Environment

- Copy the example env to a working `.env` at the repo root or set environment variables in your shell.

```bash
cp .env.example .env
# Edit .env to point DATABASE_URL and API_URL as needed
```

Important variables in `.env`:

- `PORT` — server port (default 4000)
- `DATABASE_URL` — MongoDB connection string used by Prisma
- `API_URL` — base URL used by the mobile app to reach the server (e.g. http://localhost:4000)
- `OCR_LANG` — optional Tesseract language code (defaults to `eng`)

2) Start the server (development)

```bash
cd server
npm install
# generate Prisma client after setting DATABASE_URL
npx prisma generate
# start server in dev mode
npm run dev
```

Note: `npx prisma db push` requires a live MongoDB `DATABASE_URL`. For local testing you can use a free MongoDB Atlas cluster or a local MongoDB instance.

3) Run the mobile app (development)

```bash
cd mobile
npm install
export API_URL=http://localhost:4000   # or the host IP reachable by your device/emulator
npm run start
```

Run via the Expo UI (`a` to open Android, `i` for iOS simulator, `w` for web).

---

## Project layout

- `server/` — backend implementation, routes under `server/routes/`, controllers under `server/controllers/`, Prisma schema in `server/prisma/`.
- `mobile/` — Expo app; the active mobile code is the minimal MVP in `mobile/app/`, `mobile/components/`, and `mobile/services/`.
- `mobile/backup-<timestamp>/` — backups of files removed during pruning.

---

## Notes & Caveats

- The repo was pruned to keep a minimal mobile MVP. Any files you miss were moved to `mobile/backup-<timestamp>/`.
- The server uses Prisma with the MongoDB provider. Make sure `DATABASE_URL` in `.env` points to a MongoDB instance before running `npx prisma generate` or `npx prisma db push`.
- OCR is implemented on the server (Tesseract). The mobile app uploads images to `/ocr` and receives parsed text.

---

## Troubleshooting

- If Prisma generate fails: check `DATABASE_URL`, and run `npx prisma generate` again after the variable is set.
- If the mobile app can't reach the server: ensure `API_URL` is reachable from the device/emulator (use host machine IP if needed).

---

## Contact

For development questions, open an issue or see the code in `server/` and `mobile/`.

## License

Apache-2.0