const { users, pairs, leaderboardSnapshots } = require('../data/inMemoryDB');

// Simulates what Supabase Storage would handle
function getProofDownloadUrl(storagePath) {
  if (!storagePath) return null;
  return `/api/admin/logs/proof-file?path=${encodeURIComponent(storagePath)}`;
}

// Simulates looking up a user from an org directory (would be SCIM/HRIS in prod)
function getUserFromOrgDirectory(employeeId) {
  const found = users.find(u => u.employeeId === employeeId);
  if (!found) return null;
  return { employeeId: found.employeeId, fullName: found.fullName, email: found.email };
}

// Simulates pair lookup for notifications
function getPairForUser(userId) {
  return pairs.find(p => p.user1Id === userId || p.user2Id === userId) || null;
}

// Simulates leaderboard data retrieval
function getLatestLeaderboardSnapshot(weekNumber, category) {
  return leaderboardSnapshots
    .filter(s => s.weekNumber === weekNumber && s.category === category)
    .sort((a, b) => a.rank - b.rank);
}

module.exports = { getProofDownloadUrl, getUserFromOrgDirectory, getPairForUser, getLatestLeaderboardSnapshot };
