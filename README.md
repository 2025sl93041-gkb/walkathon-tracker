# Walkathon Tracker

[![CI](https://github.com/2025sl93041-gkb/walkathon-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/2025sl93041-gkb/walkathon-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A full-stack web app for running a team walking challenge (walkathon). Any team can self-host this to track daily steps, run a chit-draw partner grouping, and publish final results.

## Features

- Member self-registration with JWT login
- Chit draw grouping — Draw Pool / Name Pool partner matching
- Daily step log with proof image upload (jpg/png/pdf, max 5 MB)
- Auto-zero for missed days
- Live leaderboard — solo top 5 + duo top 3
- Admin panel — event config, user management, dispute flags, results publishing
- Prize eligibility tracking (configurable threshold, default ≥14 days)
- Optional email domain restriction (`ALLOWED_EMAIL_DOMAIN` env var)
- Optional persistent storage via Upstash Redis + Cloudinary for proof images

## Stack

- **Backend** — Node.js + Express, in-memory data store (optional Upstash Redis), JWT auth
- **Frontend** — React 18 + Vite, Tailwind CSS

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env        # fill in JWT_SECRET and CORS_ORIGIN at minimum
npm install
npm start                   # runs on PORT from .env (default 5000)
```

### Frontend

```bash
cd frontend
cp .env.example .env        # set VITE_API_URL to your backend URL
npm install
npm run dev                 # dev server on port 3000
# OR for production:
npm run build               # outputs to frontend/dist/
```

## Default Demo Credentials

```
Admin:   admin@example.com  /  admin#1234
Members: alice@example.com  /  test1234
```

> **Change the admin password** in `backend/data/inMemoryDB.js` before deploying.

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port to listen on (default: 5000) |
| `JWT_SECRET` | Yes | Random 40+ char string for signing JWTs |
| `CORS_ORIGIN` | Yes | Frontend origin e.g. `https://walkathon.yourdomain.com` |
| `ALLOWED_EMAIL_DOMAIN` | No | Restrict registration to one domain e.g. `company.com`. Leave empty to allow any email. |
| `UPSTASH_REDIS_REST_URL` | No | Enables persistent storage via Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis auth token |
| `CLOUDINARY_CLOUD_NAME` | No | Enables cloud proof image storage |
| `CLOUDINARY_API_KEY` | No | Cloudinary credentials |
| `CLOUDINARY_API_SECRET` | No | Cloudinary credentials |

### `frontend/.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL e.g. `http://localhost:5000` |

## Data Persistence

- **Default**: In-memory only — data resets on server restart.
- **With Upstash Redis**: Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in backend `.env`. The entire DB is saved every 30 seconds as a JSON blob.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
