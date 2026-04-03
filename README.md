# Dashboard — Personal Productivity App

A full-stack personal dashboard with Google Calendar, Tasks, Notes, Financials, Weather & News.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Fastify + TypeScript |
| **ORM** | Prisma |
| **Database** | PostgreSQL |
| **Cache / PubSub** | Redis |
| **Auth** | JWT + Google OAuth 2.0 |
| **Real-time** | WebSockets (`@fastify/websocket`) |
| **Frontend** | Nuxt 3 + Vue 3 + Nuxt UI |
| **State** | Pinia |
| **Infra** | Docker Compose + Nginx |

## Project Structure

```
dashboard/
├── backend/          # Fastify API
│   ├── src/
│   │   ├── modules/  # auth / tasks / notes / financials / calendar / feeds
│   │   ├── lib/      # prisma, redis, websocket hub
│   │   └── middleware/
│   └── prisma/       # schema + migrations
├── frontend/         # Nuxt 3 app
│   ├── pages/        # / tasks/ notes/ financials/
│   ├── stores/       # Pinia stores
│   ├── composables/  # useApi, useAuth, useWebSocket
│   ├── layouts/      # default (sidebar) + auth
│   └── middleware/   # auth guard
├── nginx/            # Reverse proxy config
├── docker-compose.yml
└── docker-compose.prod.yml
```

## Getting Started

### 1. Prerequisites

- Docker & Docker Compose
- Google Cloud project with OAuth 2.0 credentials ([guide](https://console.cloud.google.com/))
- OpenWeather API key (free tier: [openweathermap.org](https://openweathermap.org/api))
- NewsAPI key (free tier: [newsapi.org](https://newsapi.org))

### 2. Google OAuth Setup

In your Google Cloud Console:
1. Enable **Google Calendar API** and **Google+ API**
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`

### 3. Configure environment

```bash
# Root
cp .env.example .env

# Backend
cp backend/.env.example backend/.env
# Fill in: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENWEATHER_API_KEY, NEWS_API_KEY, JWT_SECRET

# Frontend
cp frontend/.env.example frontend/.env
```

### 4. Run locally

```bash
docker compose up -d

# First run: apply DB migrations
docker compose exec backend npm run db:migrate
```

Visit `http://localhost:3000` → sign in with Google → you're in.

### 5. Development (without Docker)

```bash
# Start Postgres + Redis only
docker compose up -d postgres redis

# Backend
cd backend && npm install && npm run db:migrate && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## API Reference

All endpoints are prefixed with `/api/`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/me` | Current user |
| `GET` | `/auth/google` | Start Google OAuth |
| `POST` | `/auth/logout` | Sign out |
| `GET` | `/tasks` | List tasks (`?status=`) |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/:id` | Update task |
| `DELETE` | `/tasks/:id` | Delete task |
| `GET` | `/notes` | List notes (`?q=search`) |
| `POST` | `/notes` | Create note |
| `PATCH` | `/notes/:id` | Update note |
| `GET` | `/financials/invoices` | List invoices |
| `POST` | `/financials/invoices` | Create invoice |
| `POST` | `/financials/invoices/:id/payments` | Record payment |
| `GET` | `/calendar/events` | Google Calendar events |
| `GET` | `/feeds/weather?city=` | Weather |
| `GET` | `/feeds/news?q=` | News headlines |
| `WS` | `/ws?token=` | WebSocket connection |

## Deployment (Digital Ocean Droplet)

```bash
# On your droplet, clone the repo then:
cp .env.example .env  # fill in production values
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update nginx/conf.d/dashboard.conf with your real domain

# Start production stack
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# SSL with Certbot
certbot --nginx -d dashboard.yourdomain.com
```

## Features

- **Dashboard** — overview of tasks, calendar, notes, weather, news
- **Tasks** — Kanban board (Todo / In Progress / Done) with subtasks, priorities, due dates
- **Notes** — Pinterest-style note cards with color coding, pinning, full-text search
- **Financials** — invoice creation with line items + tax, payment tracking, status management, summary totals
- **Calendar** — Google Calendar integration (read-only, cached in Redis)
- **Weather** — OpenWeather current conditions (cached 10 min)
- **News** — NewsAPI headlines (cached 15 min)
- **Real-time** — WebSocket hub broadcasts task/note changes across browser tabs
- **Dark mode** — system-aware with manual toggle
