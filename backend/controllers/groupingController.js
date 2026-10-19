const { v4: uuidv4 } = require('uuid');
const { users, chitPreferences, pairs, eventConfig, safeUser } = require('../data/inMemoryDB');

// ── Shared helpers ────────────────────────────────────────────────────────────
function getPairForUser(userId) {
  return pairs.find(p => p.user1Id === userId || p.user2Id === userId) || null;
}

function getPrefForUser(userId) {
  return chitPreferences.find(cp => cp.userId === userId) || null;
}

// ── Member: get pool counts + own status ──────────────────────────────────────
function getPoolStatus(req, res) {
  if (!eventConfig.groupingTabEnabled) {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Grouping tab is not enabled yet' });
  }

  const drawPool = chitPreferences.filter(cp => cp.preference === 'draw' && !cp.excludedFromDraw);
  const namePool = chitPreferences.filter(cp => cp.preference === 'be_drawn' && !cp.excludedFromDraw);
  const drawPoolAvailable = drawPool.filter(cp => cp.isAvailable);
  const namePoolAvailable = namePool.filter(cp => cp.isAvailable);

  return res.json({
    success: true,
    data: { drawPoolTotal: drawPool.length, namePoolTotal: namePool.length, drawPoolAvailable: drawPoolAvailable.length, namePoolAvailable: namePoolAvailable.length },
    message: 'Pool status',
  });
}

// ── Member: get own pair ──────────────────────────────────────────────────────
function getMyPair(req, res) {
  const pref = getPrefForUser(req.user.userId);
  const preference = pref ? pref.preference : null;
  const pair = getPairForUser(req.user.userId);
  if (!pair) return res.json({ success: true, data: { pair: null, partner: null, preference }, message: 'Not paired yet' });

  const partnerId = pair.user1Id === req.user.userId ? pair.user2Id : pair.user1Id;
  const partner = users.find(u => u.id === partnerId);
  return res.json({ success: true, data: { pair, partner: safeUser(partner), preference }, message: 'Your duo pair' });
}

// ── Member: perform chit draw ─────────────────────────────────────────────────
function performDraw(req, res) {
  if (!eventConfig.groupingTabEnabled) {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Grouping tab is not enabled' });
  }

  const myPref = getPrefForUser(req.user.userId);
  if (!myPref) return res.status(400).json({ success: false, error: 'Bad Request', message: 'No chit preference found for your account' });
  if (myPref.preference !== 'draw') return res.status(400).json({ success: false, error: 'Bad Request', message: 'Only Draw Pool members can draw a name' });
  if (myPref.excludedFromDraw) return res.status(400).json({ success: false, error: 'Bad Request', message: 'You are excluded from the draw' });

  // BR-07: draw exactly once
  const alreadyPaired = getPairForUser(req.user.userId);
  if (alreadyPaired) return res.status(409).json({ success: false, error: 'Conflict', message: 'You have already drawn a name' });

  // Pick random available Name Pool member
  const available = chitPreferences.filter(cp => cp.preference === 'be_drawn' && cp.isAvailable && !cp.excludedFromDraw);
  if (available.length === 0) return res.status(409).json({ success: false, error: 'Conflict', message: 'No available names in the box. Ask admin to add more.' });

  const picked = available[Math.floor(Math.random() * available.length)];
  picked.isAvailable = false; // BR-07: mark as drawn
  myPref.isAvailable = false;

  const newPair = { id: uuidv4(), user1Id: req.user.userId, user2Id: picked.userId, method: 'chit_draw', createdAt: new Date().toISOString() };
  pairs.push(newPair);

  const partner = users.find(u => u.id === picked.userId);
  const me = users.find(u => u.id === req.user.userId);

  console.log(`──── EMAIL ────\nTo:      ${partner.email}\nSubject: You've been paired!\nBody:    Hi ${partner.fullName}, ${me.fullName} drew your name! You are now a Duo team. Good luck!\n───────────────`);
  console.log(`──── EMAIL ────\nTo:      ${me.email}\nSubject: Duo Draw Result\nBody:    Hi ${me.fullName}, you drew ${partner.fullName}! You are now a Duo team. Good luck!\n───────────────`);

  return res.json({ success: true, data: { pair: newPair, partner: safeUser(partner) }, message: `You drew ${partner.fullName}!`, notificationSent: true });
}

// ── Admin: full grouping view ─────────────────────────────────────────────────
function adminGetGrouping(req, res) {
  const enriched = users.map(u => {
    const pref = getPrefForUser(u.id);
    const pair = getPairForUser(u.id);
    let partnerId = null;
    if (pair) partnerId = pair.user1Id === u.id ? pair.user2Id : pair.user1Id;
    return {
      ...safeUser(u),
      preference: pref ? pref.preference : null,
      isAvailable: pref ? pref.isAvailable : null,
      excludedFromDraw: pref ? pref.excludedFromDraw : false,
      pairId: pair ? pair.id : null,
      partnerId,
    };
  });

  return res.json({ success: true, data: { users: enriched, pairs }, message: 'Grouping overview' });
}

// ── Admin: move user between pools ────────────────────────────────────────────
function adminMovePool(req, res) {
  const { userId } = req.params;
  const { preference } = req.body;
  if (!['draw', 'be_drawn'].includes(preference)) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'preference must be "draw" or "be_drawn"' });
  }
  const pref = chitPreferences.find(cp => cp.userId === userId);
  if (!pref) return res.status(404).json({ success: false, error: 'Not Found', message: 'User preference not found' });
  pref.preference = preference;
  return res.json({ success: true, data: pref, message: 'Pool updated' });
}

// ── Admin: toggle exclude from draw ──────────────────────────────────────────
function adminToggleExclude(req, res) {
  const { userId } = req.params;
  const { excludedFromDraw } = req.body;
  if (typeof excludedFromDraw !== 'boolean') {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'excludedFromDraw must be boolean' });
  }
  const pref = chitPreferences.find(cp => cp.userId === userId);
  if (!pref) return res.status(404).json({ success: false, error: 'Not Found', message: 'User preference not found' });
  pref.excludedFromDraw = excludedFromDraw;
  return res.json({ success: true, data: pref, message: `User ${excludedFromDraw ? 'excluded from' : 'included in'} draw` });
}

// ── Admin: manually create pair ───────────────────────────────────────────────
function adminCreatePair(req, res) {
  const { user1Id, user2Id } = req.body;
  if (!user1Id || !user2Id) return res.status(400).json({ success: false, error: 'Bad Request', message: 'user1Id and user2Id required' });
  if (user1Id === user2Id) return res.status(400).json({ success: false, error: 'Bad Request', message: 'Cannot pair a user with themselves' });

  if (!users.find(u => u.id === user1Id) || !users.find(u => u.id === user2Id)) {
    return res.status(404).json({ success: false, error: 'Not Found', message: 'One or both users not found' });
  }
  if (getPairForUser(user1Id)) return res.status(409).json({ success: false, error: 'Conflict', message: 'user1 is already paired' });
  if (getPairForUser(user2Id)) return res.status(409).json({ success: false, error: 'Conflict', message: 'user2 is already paired' });

  const newPair = { id: uuidv4(), user1Id, user2Id, method: 'manual', createdAt: new Date().toISOString() };
  pairs.push(newPair);

  // Mark both as unavailable
  const p1 = chitPreferences.find(cp => cp.userId === user1Id);
  const p2 = chitPreferences.find(cp => cp.userId === user2Id);
  if (p1) p1.isAvailable = false;
  if (p2) p2.isAvailable = false;

  return res.status(201).json({ success: true, data: newPair, message: 'Pair created manually' });
}

// ── Admin: break pair ─────────────────────────────────────────────────────────
function adminBreakPair(req, res) {
  const { pairId } = req.params;
  const idx = pairs.findIndex(p => p.id === pairId);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not Found', message: 'Pair not found' });

  const [removed] = pairs.splice(idx, 1);

  // Re-mark both users as available
  for (const uid of [removed.user1Id, removed.user2Id]) {
    const pref = chitPreferences.find(cp => cp.userId === uid);
    if (pref) pref.isAvailable = true;
  }

  return res.json({ success: true, data: removed, message: 'Pair broken. Both users returned to their pools.' });
}

module.exports = { getPoolStatus, getMyPair, performDraw, adminGetGrouping, adminMovePool, adminToggleExclude, adminCreatePair, adminBreakPair };
