const { v4: uuidv4 } = require('uuid');
const { users, pairs, dailyLogs, bonusAwards, eventConfig, safeUser } = require('../data/inMemoryDB');

const STEPS_PER_KM = 1300;

function computeAllUserTotals() {
  const totals = {};
  for (const log of dailyLogs) {
    totals[log.userId] = (totals[log.userId] || 0) + log.stepCount;
  }
  return totals;
}

function computeResults({ ignoreEligibility = false } = {}) {
  const userTotals = computeAllUserTotals();
  const teamTotal = Object.values(userTotals).reduce((a, b) => a + b, 0);

  const soloRanked = users
    .filter(u => u.role === 'member')
    .map(u => {
      const days = dailyLogs.filter(l => l.userId === u.id && !l.isAutoZero).length;
      return { user: safeUser(u), totalSteps: userTotals[u.id] || 0, daysLogged: days, eligible: days >= 14 };
    })
    .filter(r => ignoreEligibility || r.eligible)
    .sort((a, b) => b.totalSteps - a.totalSteps);

  const duoRanked = pairs
    .map(p => {
      const u1 = users.find(u => u.id === p.user1Id);
      const u2 = users.find(u => u.id === p.user2Id);
      const days1 = dailyLogs.filter(l => l.userId === p.user1Id && !l.isAutoZero).length;
      const days2 = dailyLogs.filter(l => l.userId === p.user2Id && !l.isAutoZero).length;
      const eligible = days1 >= 14 && days2 >= 14;
      return { pair: p, member1: safeUser(u1), member2: safeUser(u2), combinedSteps: (userTotals[p.user1Id] || 0) + (userTotals[p.user2Id] || 0), days1, days2, eligible };
    })
    .filter(p => ignoreEligibility || p.eligible)
    .sort((a, b) => b.combinedSteps - a.combinedSteps);

  let biggestSingleDay = null;
  for (const log of dailyLogs) {
    if (!biggestSingleDay || log.stepCount > biggestSingleDay.stepCount) biggestSingleDay = log;
  }
  if (biggestSingleDay) {
    const u = users.find(x => x.id === biggestSingleDay.userId);
    biggestSingleDay = { ...biggestSingleDay, fullName: u?.fullName };
  }

  return {
    soloWinner: soloRanked[0] || null,
    soloRunnerUp: soloRanked[1] || null,
    duoWinner: duoRanked[0] || null,
    duoRunnerUp: duoRanked[1] || null,
    soloRanked,
    userTotals,
    recapStats: {
      teamTotalSteps: teamTotal,
      teamTotalKm: +(teamTotal / STEPS_PER_KM).toFixed(1),
      biggestSingleDay,
    },
  };
}

// ── Authenticated: get results (only if published) ────────────────────────────
function getResults(req, res) {
  if (!eventConfig.resultsPublished) {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Results have not been published yet' });
  }
  const { soloWinner, soloRunnerUp, duoWinner, duoRunnerUp, recapStats } = computeResults();
  return res.json({ success: true, data: { soloWinner, soloRunnerUp, duoWinner, duoRunnerUp, bonusAwards, recapStats }, message: 'Final results' });
}

// ── Admin: preview results (no eligibility filter) ────────────────────────────
function adminPreviewResults(req, res) {
  const { soloWinner, soloRunnerUp, duoWinner, duoRunnerUp, recapStats } = computeResults({ ignoreEligibility: true });
  return res.json({ success: true, data: { soloWinner, soloRunnerUp, duoWinner, duoRunnerUp, bonusAwards, recapStats, resultsPublished: eventConfig.resultsPublished }, message: 'Results preview (eligibility not applied)' });
}

// ── Admin: list bonus awards ──────────────────────────────────────────────────
function adminListBonusAwards(req, res) {
  return res.json({ success: true, data: bonusAwards, message: 'Bonus awards' });
}

// ── Admin: publish results ────────────────────────────────────────────────────
async function adminPublishResults(req, res) {
  eventConfig.resultsPublished = true;
  return res.json({ success: true, data: { resultsPublished: true }, message: 'Results published.' });
}

// ── Admin: unpublish results ──────────────────────────────────────────────────
function adminUnpublishResults(req, res) {
  eventConfig.resultsPublished = false;
  return res.json({ success: true, data: { resultsPublished: false }, message: 'Results unpublished. Members can no longer see results.' });
}

// ── Admin: add bonus award ────────────────────────────────────────────────────
async function adminAddBonusAward(req, res) {
  const { category, recipientName, recipientUserId, description } = req.body;
  const validCategories = ['Most Consistent Walker', 'Most Improved', 'Team Spirit'];
  if (!category || !recipientName) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'category and recipientName required' });
  }
  if (!validCategories.includes(category)) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: `category must be one of: ${validCategories.join(', ')}` });
  }

  const award = { id: uuidv4(), category, recipientName, recipientUserId: recipientUserId || null, description: description || '', createdAt: new Date().toISOString() };
  bonusAwards.push(award);

  return res.status(201).json({ success: true, data: award, message: 'Bonus award added' });
}

// ── Admin: remove bonus award ─────────────────────────────────────────────────
function adminRemoveBonusAward(req, res) {
  const { awardId } = req.params;
  const idx = bonusAwards.findIndex(a => a.id === awardId);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not Found', message: 'Award not found' });
  const [removed] = bonusAwards.splice(idx, 1);
  return res.json({ success: true, data: removed, message: 'Bonus award removed' });
}

module.exports = { getResults, adminPreviewResults, adminPublishResults, adminUnpublishResults, adminAddBonusAward, adminRemoveBonusAward, adminListBonusAwards };
