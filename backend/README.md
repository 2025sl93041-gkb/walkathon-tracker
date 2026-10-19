# Walkathon Backend

Express REST API for Walkathon Tracker.

## Setup

```bash
cd backend
npm install
node server.js        # production
npm run dev           # dev with nodemon (auto-restart)
```

Runs on **http://localhost:5000**

---

## Default Seed Credentials

| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin User | admin@example.com | admin#1234 | admin |
| Alice Johnson | alice@example.com | test1234 | member |
| Bob Smith | bob@example.com | test1234 | member |

> **Change the admin password** before deploying to production.

---

## Endpoint Table

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | Public | Register new member (registration_open must be true) |
| POST | /api/auth/login | Public | Login, returns JWT |
| GET | /api/auth/me | Any | Current user info |

### Event Config
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/config | Public | Event config (public fields) |
| GET | /api/config/admin | Admin | Full config |
| PATCH | /api/config/admin | Admin | Update any config field |

### Grouping / Chit Draw
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/grouping/status | Any | Pool counts (draw vs name pool) |
| GET | /api/grouping/my-pair | Any | Own pair + partner info |
| POST | /api/grouping/draw | Member | Perform chit draw (Draw Pool only, once) |
| GET | /api/grouping/admin | Admin | Full grouping overview: all users, all pairs |
| PATCH | /api/grouping/admin/preferences/:userId | Admin | Move user between draw/name pool |
| PATCH | /api/grouping/admin/exclude/:userId | Admin | Include/exclude user from draw |
| POST | /api/grouping/admin/pairs | Admin | Manually create pair |
| DELETE | /api/grouping/admin/pairs/:pairId | Admin | Break a pair |

### Daily Logs
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/logs/deadline-status | Any | Is today's form open or locked? |
| GET | /api/logs/my | Any | Own log history + eligibility |
| POST | /api/logs | Any | Submit step count + proof (multipart/form-data) |
| GET | /api/logs/admin/all | Admin | All users × all days matrix |
| PATCH | /api/logs/admin/:logId/dispute | Admin | Flag/unflag log as disputed |
| GET | /api/logs/admin/:logId/proof | Admin | Download proof file |
| POST | /api/logs/admin/apply-zeros | Admin | Write auto-zero for all missed past days |

### Leaderboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/leaderboard | Any | Live leaderboard: Solo Top 5, Duo Top 3, fun stats |
| GET | /api/leaderboard/admin/snapshots | Admin | Stored weekly snapshots |
| POST | /api/leaderboard/admin/recalculate | Admin | Recalculate + store snapshot for a week |

### Results
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/results | Any | Final results (only if results_published = true) |
| POST | /api/results/admin/publish | Admin | Publish results (notifies all members) |
| POST | /api/results/admin/bonus-awards | Admin | Add bonus award |
| DELETE | /api/results/admin/bonus-awards/:awardId | Admin | Remove bonus award |

### Users (Admin)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/users | Admin | All users with pairing + eligibility status |
| PATCH | /api/users/:userId | Admin | Update user role or basic fields |

---

## Critical Flow — curl Examples

### 1. Login as admin
```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin#1234"}' | jq .
```

### 2. Register new member (set TOKEN from login first)
```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test.user@company.com","phoneNumber":"+1-5559999999","password":"password123","chitPreference":"draw"}' | jq .
```
> Requires `registrationOpen: true`. Enable via PATCH /api/config/admin.

### 3. Open registration, then enable grouping tab
```bash
export TOKEN="<admin JWT from step 1>"
curl -s -X PATCH http://localhost:5000/api/config/admin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"registrationOpen":true,"groupingTabEnabled":true,"challengeTabEnabled":true}' | jq .
```

### 4. Perform chit draw (as Draw Pool member)
```bash
export MEMBER_TOKEN="<member JWT from login>"
curl -s -X POST http://localhost:5000/api/grouping/draw \
  -H "Authorization: Bearer $MEMBER_TOKEN" | jq .
```

### 5. Submit daily log with proof
```bash
curl -s -X POST http://localhost:5000/api/logs \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -F "stepCount=8500" \
  -F "proof=@/path/to/screenshot.jpg" | jq .
```

### 6. View leaderboard
```bash
curl -s http://localhost:5000/api/leaderboard \
  -H "Authorization: Bearer $MEMBER_TOKEN" | jq .
```

### 7. Publish results
```bash
curl -s -X POST http://localhost:5000/api/results/admin/publish \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Business Rules Enforced

| Rule | Endpoint |
|------|----------|
| BR-01: optional domain restriction (env `ALLOWED_EMAIL_DOMAIN`) | POST /api/auth/register |
| BR-02: unique employee ID (if provided) | POST /api/auth/register |
| BR-03: registration gate | POST /api/auth/register |
| BR-04: 10 AM deadline + auto-zero | POST /api/logs, POST /api/logs/admin/apply-zeros |
| BR-05: no back-fill | POST /api/logs |
| BR-06: 14-day eligibility | GET /api/logs/my, GET /api/results |
| BR-07: draw-once / drawn-once | POST /api/grouping/draw |
| BR-10: leaderboard recalc trigger | POST /api/leaderboard/admin/recalculate |
| BR-11: results gate | GET /api/results |

---

## Notes

- Data resets on server restart (in-memory)
- Proof files stored at `backend/uploads/proofs/{userId}/{logDate}.ext`
- JWT secret: `walkathon_secret_key` — change before any real deployment
- Deadline timezone: IST (UTC+5:30) — hardcoded assumption, see OQ-01 in PRD
