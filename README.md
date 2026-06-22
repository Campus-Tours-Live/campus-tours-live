# CampusToursLive.ai

> 🚧 **In active development.** Things move fast, so this overview is intentionally light — see each service's own repo for details.

A live campus-tours platform, split into three services:

| Service | What it is | Stack | Port |
| --- | --- | --- | --- |
| [frontend](https://github.com/Campus-Tours-Live/frontend) | Web app (UI) | Next.js / React / TypeScript | `3001` |
| [bff](https://github.com/Campus-Tours-Live/bff) | Backend-for-frontend: auth, session, API aggregation & proxy | Node.js / TypeScript / Express | `4000` |
| [backend](https://github.com/Campus-Tours-Live/backend) | Core API + data | Java 21 / Spring Boot / PostgreSQL | `8080` |

Request flow: **frontend (:3001) → bff (:4000) → backend (:8080)**.
Make sure those three ports are free before starting.

## This repo

`campus-tours-live` is the project overview plus a small cross-platform **dev launcher** (Windows / macOS / Linux). The launcher is plain Node — no dependencies, no `npm install` needed.

It assumes the four repos are cloned **side by side** under one parent folder:

```
your-dev-folder/
├── campus-tours-live/   ← you are here
├── backend/
├── bff/
└── frontend/
```

## Prerequisites

- **Node.js 20+** — runs the launcher, the bff, and the frontend
- **Java 21** — backend (the bundled `mvnw` wrapper handles Maven)
- **Docker** — backend's PostgreSQL, started automatically by the launcher
- **bff/.env** — copy `bff/.env.example` → `bff/.env` and fill in `SESSION_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. The bff refuses to start without them.
  The frontend's `.env` is optional.
- **Windows**: run the commands in PowerShell or Windows Terminal — the launcher is
  Node, so Git Bash / WSL is not required.

## Getting started

```bash
# 1. From inside this repo, pull the other three repos as siblings
npm run clone-all

# 2. Set up the bff env (one time), then fill in the required vars
cp ../bff/.env.example ../bff/.env

# 3. Start everything
npm run start:all
```

Or start services individually:

```bash
npm run start:backend     # Postgres (docker) + Spring Boot
npm run start:bff
npm run start:frontend
```

`start:all` launches the backend (waiting until it reports healthy), then the bff
and frontend, with each service's logs prefixed by name. Press **Ctrl-C once** to
stop all of them.

> The launcher starts Postgres with `docker compose up -d` and leaves it running.
> To stop it: `cd ../backend && docker compose down`.
