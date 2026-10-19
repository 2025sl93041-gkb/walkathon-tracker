const { v4: uuidv4 } = require('uuid');
const { users, pairs, dailyLogs, leaderboardSnapshots, eventConfig, safeUser } = require('../data/inMemoryDB');

const STEPS_PER_KM = 1300;
const MIN_ELIGIBLE_DAYS = 14;

function computeLiveTotals(upToDay) {
  const eventStart = new Date(eventConfig.startDate);
  const totals = {};
  for (const log of dailyLogs) {
    if (upToDay !== undefined) {
      const dayNum = Math.round((new Date(log.logDate) - eventStart) / 86400000) + 1;
      if (dayNum > upToDay) continue;
    }
    totals[log.userId] = (totals[log.userId] || 0) + log.stepCount;
  }
  return totals;
}

function computeEligibleDays(userId) {
  return dailyLogs.filter(l => l.userId === userId && !l.isAutoZero).length;
}

function computeMostConsistent() {
  let best = null, bestCount = 0;
  for (const user of users.filter(u => u.role === 'member')) {
    const count = computeEligibleDays(user.id);
    if (count > bestCount) { bestCount = count; best = user; }
  }
  return best ? { userId: best.id, fullName: best.fullName, daysLogged: bestCount } : null;
}

// ── Authenticated: get leaderboard ────────────────────────────────────────────
function getLeaderboard(req, res) {
  const userTotals = computeLiveTotals();
  const teamTotal = Object.values(userTotals).reduce((a, b) => a + b, 0);

  // Solo top 5 — members only
  const solo = Object.entries(userTotals)
    .filter(([userId]) => users.find(u => u.id === userId)?.role === 'member')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, totalSteps], i) => {
      const user = users.find(u => u.id === userId);
      const eligibleDays = computeEligibleDays(userId);
      return { rank: i + 1, userId, fullName: user.fullName, totalSteps, eligibleDays, eligible: eligibleDays >= MIN_ELIGIBLE_DAYS };
    });

  // Duo top 3
  const duo = pairs
    .map(pair => {
      const u1 = users.find(u => u.id === pair.user1Id);
      const u2 = users.find(u => u.id === pair.user2Id);
      const combined = (userTotals[pair.user1Id] || 0) + (userTotals[pair.user2Id] || 0);
      return { pairId: pair.id, member1: safeUser(u1), member2: safeUser(u2), combinedSteps: combined };
    })
    .sort((a, b) => b.combinedSteps - a.combinedSteps)
    .slice(0, 3)
    .map((entry, i) => ({ rank: i + 1, ...entry }));

  const funStats = {
    teamTotalSteps: teamTotal,
    teamTotalKm: +(teamTotal / STEPS_PER_KM).toFixed(1),
    mostConsistent: computeMostConsistent(),
    biggestSingleDay: (() => {
      let best = null;
      for (const log of dailyLogs) {
        if (!best || log.stepCount > best.stepCount) best = log;
      }
      if (!best) return null;
      const user = users.find(u => u.id === best.userId);
      return { userId: best.userId, fullName: user.fullName, logDate: best.logDate, stepCount: best.stepCount };
    })(),
  };

  return res.json({ success: true, data: { solo, duo, funStats, lastUpdated: new Date().toISOString() }, message: 'Current leaderboard' });
}

// ── Admin: trigger recalculation + store snapshot ────────────────────────────
function adminRecalculate(req, res) {
  const { weekNumber } = req.body;
  if (![1, 2, 3].includes(Number(weekNumber))) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'weekNumber must be 1, 2, or 3' });
  }

  const wk = Number(weekNumber);
  const upToDay = wk * 7;
  const eventStart = new Date(eventConfig.startDate);
  const calcAt = new Date(eventStart);
  calcAt.setUTCDate(calcAt.getUTCDate() + upToDay);

  const userTotals = computeLiveTotals(upToDay);

  // Remove old snapshots for this week
  const toRemove = leaderboardSnapshots.filter(s => s.weekNumber === wk);
  toRemove.forEach(s => { const i = leaderboardSnapshots.indexOf(s); if (i > -1) leaderboardSnapshots.splice(i, 1); });

  // Solo top 5 — members only
  const soloSorted = Object.entries(userTotals)
    .filter(([userId]) => users.find(u => u.id === userId)?.role === 'member')
    .sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (let i = 0; i < soloSorted.length; i++) {
    leaderboardSnapshots.push({ id: uuidv4(), weekNumber: wk, category: 'solo', rank: i + 1, userId: soloSorted[i][0], pairId: null, totalSteps: soloSorted[i][1], calculatedAt: calcAt.toISOString() });
  }

  // Duo top 3
  const pairTotals = pairs.map(p => ({ pairId: p.id, total: (userTotals[p.user1Id] || 0) + (userTotals[p.user2Id] || 0) }));
  pairTotals.sort((a, b) => b.total - a.total);
  for (let i = 0; i < 3 && i < pairTotals.length; i++) {
    leaderboardSnapshots.push({ id: uuidv4(), weekNumber: wk, category: 'duo', rank: i + 1, userId: null, pairId: pairTotals[i].pairId, totalSteps: pairTotals[i].total, calculatedAt: calcAt.toISOString() });
  }

  const newSnaps = leaderboardSnapshots.filter(s => s.weekNumber === wk);
  return res.json({ success: true, data: { weekNumber: wk, snapshots: newSnaps }, message: `Week ${wk} leaderboard recalculated` });
}

// ── Admin: get snapshots by week ──────────────────────────────────────────────
function adminGetSnapshots(req, res) {
  const { week } = req.query;
  const filtered = week ? leaderboardSnapshots.filter(s => s.weekNumber === Number(week)) : leaderboardSnapshots;
  return res.json({ success: true, data: filtered, message: 'Leaderboard snapshots' });
}

module.exports = { getLeaderboard, adminRecalculate, adminGetSnapshots };
