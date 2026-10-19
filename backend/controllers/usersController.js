const { users, chitPreferences, pairs, dailyLogs, safeUser } = require('../data/inMemoryDB');

function getPairForUser(userId) {
  return pairs.find(p => p.user1Id === userId || p.user2Id === userId) || null;
}

// ── Admin: list all users with pairing + eligibility info ─────────────────────
function getAllUsers(req, res) {
  const enriched = users.map(u => {
    const pref = chitPreferences.find(cp => cp.userId === u.id);
    const pair = getPairForUser(u.id);
    const daysLogged = dailyLogs.filter(l => l.userId === u.id && !l.isAutoZero).length;
    return {
      ...safeUser(u),
      chitPreference: pref ? pref.preference : null,
      isPaired: !!pair,
      pairId: pair ? pair.id : null,
      daysLogged,
      eligible: daysLogged >= 14,
    };
  });
  return res.json({ success: true, data: enriched, message: 'All users' });
}

// ── Admin: update user (role or basic fields) ─────────────────────────────────
function updateUser(req, res) {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, error: 'Not Found', message: 'User not found' });

  const allowed = ['fullName', 'phoneNumber', 'role'];
  for (const key of allowed) {
    if (key in req.body) {
      if (key === 'role' && !['admin', 'member'].includes(req.body.role)) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'role must be admin or member' });
      }
      user[key] = req.body[key];
    }
  }

  return res.json({ success: true, data: safeUser(user), message: 'User updated' });
}

// ── Admin: delete user (cascades logs, pair, chit pref) ──────────────────────
function deleteUser(req, res) {
  const { userId } = req.params;
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not Found', message: 'User not found' });

  const pair = pairs.find(p => p.user1Id === userId || p.user2Id === userId);
  if (pair) {
    const pairIdx = pairs.findIndex(p => p.id === pair.id);
    if (pairIdx !== -1) pairs.splice(pairIdx, 1);
  }

  const prefIdx = chitPreferences.findIndex(cp => cp.userId === userId);
  if (prefIdx !== -1) chitPreferences.splice(prefIdx, 1);

  const logIndices = dailyLogs.reduce((acc, l, i) => { if (l.userId === userId) acc.push(i); return acc; }, []);
  for (let i = logIndices.length - 1; i >= 0; i--) dailyLogs.splice(logIndices[i], 1);

  users.splice(idx, 1);
  return res.json({ success: true, data: null, message: 'User deleted' });
}

module.exports = { getAllUsers, updateUser, deleteUser };
