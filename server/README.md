# Slipwise Server

Simple backend for the Slipwise mobile app: Express + Prisma (MongoDB).

Quick start

1. cd server
2. Copy `.env.example` to `.env` and edit if needed.
3. npm install
4. Run Prisma generate then start the server:

```bash
npx prisma generate
npm run dev  # development with nodemon
# or
npm start
```

## Quick setup commands

Run the following from the repository root or from the `server/` folder as noted.

```bash
# from repo root
cd server

# install deps
npm install

# copy example env and edit as needed
cp .env.example .env

# (only if you haven't initialized Prisma) initialize Prisma for MongoDB
# npx prisma init --datasource-provider mongodb

# push schema to the database (creates collections)
npx prisma db push

# generate Prisma client
npx prisma generate

# optional: open Prisma Studio to inspect data
npx prisma studio

# start development server
npm run dev

# or start normally
npm start

# verify server is running
curl http://localhost:4000/
```
