require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// ── Persistence ───────────────────────────────────────────────────────────────
const db = require('./data/inMemoryDB');
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data/db.json');

// Upstash Redis — used when env vars are present; falls back to local JSON file
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require('@upstash/redis');
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('[persistence] Upstash Redis enabled');
}

const DB_KEY = 'walkathon_db';

function buildSnapshot() {
  return {
    eventConfig: db.eventConfig,
    users: db.users,
    chitPreferences: db.chitPreferences,
    pairs: db.pairs,
    dailyLogs: db.dailyLogs,
    leaderboardSnapshots: db.leaderboardSnapshots,
    bonusAwards: db.bonusAwards,
  };
}

function applySnapshot(saved) {
  if (!saved) return;
  if (saved.eventConfig) Object.assign(db.eventConfig, saved.eventConfig);
  if (saved.users?.length)                db.users.splice(0, db.users.length, ...saved.users);
  if (saved.chitPreferences?.length)      db.chitPreferences.splice(0, db.chitPreferences.length, ...saved.chitPreferences);
  if (saved.pairs?.length)                db.pairs.splice(0, db.pairs.length, ...saved.pairs);
  if (saved.dailyLogs?.length)            db.dailyLogs.splice(0, db.dailyLogs.length, ...saved.dailyLogs);
  if (saved.leaderboardSnapshots?.length) db.leaderboardSnapshots.splice(0, db.leaderboardSnapshots.length, ...saved.leaderboardSnapshots);
  if (saved.bonusAwards?.length)          db.bonusAwards.splice(0, db.bonusAwards.length, ...saved.bonusAwards);
}

async function loadData() {
  try {
    if (redis) {
      const saved = await redis.get(DB_KEY);
      if (saved) {
        applySnapshot(saved);
        console.log('[persistence] Loaded from Upstash Redis');
        return;
      }
    }
    // Fallback: local JSON file
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      applySnapshot(saved);
      console.log(`[persistence] Loaded from ${DATA_FILE}`);
    }
  } catch (e) {
    console.error('[persistence] Load failed:', e.message);
  }
}

async function saveData() {
  const snapshot = buildSnapshot();
  try {
    if (redis) {
      await redis.set(DB_KEY, snapshot);
    }
  } catch (e) {
    console.error('[persistence] Redis save failed:', e.message);
  }
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot));
  } catch (e) {
    console.error('[persistence] File save failed:', e.message);
  }
}

// Security headers — CSP disabled so Vite-built React app loads correctly
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Request logging
app.use(morgan('combined'));

// CORS
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limit: auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too Many Requests', message: 'Too many attempts. Try again in 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Serve uploaded proof files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/config',      require('./routes/config'));
app.use('/api/grouping',    require('./routes/grouping'));
app.use('/api/logs',        require('./routes/logs'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/results',     require('./routes/results'));
app.use('/api/users',       require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', app: 'walkathon', port: PORT }, message: 'Server is running' });
});

// Serve React frontend (production build)
const FRONTEND_DIST = process.env.FRONTEND_DIST || path.join(__dirname, 'frontend-dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not Found', message: `Route ${req.method} ${req.path} not found` });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ success: false, error: err.message || 'Internal Server Error', message: err.message || 'Something went wrong' });
});

app.listen(PORT, async () => {
  console.log(`Walkathon backend running on http://localhost:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);

  await loadData();
  setInterval(saveData, 30 * 1000);

  const { applyAutoZeros } = require('./controllers/logsController');
  setInterval(() => {
    const count = applyAutoZeros();
    if (count > 0) console.log(`[auto-zero] Applied ${count} zero entries`);
  }, 60 * 1000);
});

module.exports = app;
