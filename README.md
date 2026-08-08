# Personal Assistant

A self-hosted personal productivity hub. First app: **Packing Lists**.

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL (Docker) |
| ORM | Prisma |
| Auth | NextAuth v5 (credentials + invite codes) |
| Styling | Tailwind CSS (VS Code / Monarch Money aesthetic) |
| Deployment | Docker Compose |

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- Docker Desktop

### 1. Start the database

```bash
docker compose up -d db
```

### 2. Install and migrate

```bash
npm install
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### 3. Set up environment

```bash
cp .env.example .env
# Set AUTH_SECRET: openssl rand -base64 32
```

### 4. Start dev server

```bash
npm run dev
```

Open http://localhost:3000. Register at `/register` with invite code `WELCOME-2024`, `PACK-IT-UP`, or `ASSISTANT-01`.

---

## Production

```bash
# Set AUTH_SECRET in .env first
docker compose up -d
```

Migrations run automatically on startup.

---

## Features — Packing Lists

- Trips with name, destination, dates, status (Planning → Packing → Traveling → Completed)
- Per-item: quantity, bag, gathered, packed, pre/post-trip notes
- Items grouped by category (collapsible), sortable
- Default items auto-populate new lists
- Copy any list as a starting point for a new trip
- Share: public link (no login) or invite-only (specific users)
- Invite-code gated registration
