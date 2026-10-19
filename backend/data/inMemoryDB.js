const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const h = (pw) => bcrypt.hashSync(pw, 10);

// ── Event Config (single row) ─────────────────────────────────────────────────
const eventConfig = {
  id: 1,
  eventName: 'My Team Walkathon',
  startDate: '',
  endDate: '',
  dailyOpenTime: '06:00',
  dailyDeadlineTime: '10:00',
  registrationOpen: true,
  groupingTabEnabled: false,
  challengeTabEnabled: false,
  resultsPublished: false,
  leaderboardAutoRecalc: true,
  eventStatus: 'draft', // draft | registration | active | completed
};

// ── Users ─────────────────────────────────────────────────────────────────────
// Admin accounts only — members register via POST /api/auth/register
const u1id = uuidv4(), u2id = uuidv4(), u3id = uuidv4(), u4id = uuidv4();
const users = [
  { id: uuidv4(),  fullName: 'Admin User',    email: 'admin@example.com',   phoneNumber: '+1-5550000000', employeeId: 'E000001', role: 'admin',  passwordHash: h('admin#1234'), createdAt: new Date().toISOString() },
  { id: u1id,      fullName: 'Alice Johnson',  email: 'alice@example.com',   phoneNumber: '+1-5550000001', employeeId: 'E000002', role: 'member', passwordHash: h('test1234'),   createdAt: new Date().toISOString() },
  { id: u2id,      fullName: 'Bob Smith',      email: 'bob@example.com',     phoneNumber: '+1-5550000002', employeeId: 'E000003', role: 'member', passwordHash: h('test1234'),   createdAt: new Date().toISOString() },
  { id: u3id,      fullName: 'Carol Davis',    email: 'carol@example.com',   phoneNumber: '+1-5550000003', employeeId: 'E000004', role: 'member', passwordHash: h('test1234'),   createdAt: new Date().toISOString() },
  { id: u4id,      fullName: 'Dave Wilson',    email: 'dave@example.com',    phoneNumber: '+1-5550000004', employeeId: 'E000005', role: 'member', passwordHash: h('test1234'),   createdAt: new Date().toISOString() },
];

// ── All other collections start empty — populated at runtime ──────────────────
const chitPreferences = [
  { id: uuidv4(), userId: u1id, preference: 'draw',     isAvailable: true,  excludedFromDraw: false },
  { id: uuidv4(), userId: u2id, preference: 'draw',     isAvailable: true,  excludedFromDraw: false },
  { id: uuidv4(), userId: u3id, preference: 'be_drawn', isAvailable: true,  excludedFromDraw: false },
  { id: uuidv4(), userId: u4id, preference: 'be_drawn', isAvailable: true,  excludedFromDraw: false },
];
const pairs = [];
const dailyLogs = [];
const leaderboardSnapshots = [];
const bonusAwards = [];

// ── Helper: get user without passwordHash ─────────────────────────────────────
function safeUser(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

module.exports = { eventConfig, users, chitPreferences, pairs, dailyLogs, leaderboardSnapshots, bonusAwards, safeUser };
