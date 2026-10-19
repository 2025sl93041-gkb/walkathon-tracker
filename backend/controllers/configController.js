const { eventConfig, users, chitPreferences, pairs, dailyLogs, leaderboardSnapshots, bonusAwards } = require('../data/inMemoryDB');

function getConfig(req, res) {
  const { id, eventName, startDate, endDate, dailyOpenTime, dailyDeadlineTime, registrationOpen, groupingTabEnabled, challengeTabEnabled, resultsPublished, eventStatus } = eventConfig;
  return res.json({ success: true, data: { id, eventName, startDate, endDate, dailyOpenTime, dailyDeadlineTime, registrationOpen, groupingTabEnabled, challengeTabEnabled, resultsPublished, eventStatus }, message: 'Event config' });
}

function getAdminConfig(req, res) {
  return res.json({ success: true, data: { ...eventConfig }, message: 'Full event config' });
}

function updateConfig(req, res) {
  const allowed = ['eventName', 'startDate', 'endDate', 'dailyOpenTime', 'dailyDeadlineTime', 'registrationOpen', 'groupingTabEnabled', 'challengeTabEnabled', 'resultsPublished', 'leaderboardAutoRecalc'];
  let updated = false;
  for (const key of allowed) {
    if (key in req.body) { eventConfig[key] = req.body[key]; updated = true; }
  }
  if (!updated) return res.status(400).json({ success: false, error: 'Bad Request', message: 'No valid fields provided' });
  return res.json({ success: true, data: { ...eventConfig }, message: 'Event config updated' });
}

// ── Admin: set event status ───────────────────────────────────────────────────
// Transitions: draft → registration → active → completed (and reversible)
function setEventStatus(req, res) {
  const { status } = req.body;
  const valid = ['draft', 'registration', 'active', 'completed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: `status must be one of: ${valid.join(', ')}` });
  }

  eventConfig.eventStatus = status;

  // Sync visibility toggles with status
  if (status === 'draft') {
    eventConfig.registrationOpen = false;
    eventConfig.groupingTabEnabled = false;
    eventConfig.challengeTabEnabled = false;
  } else if (status === 'registration') {
    eventConfig.registrationOpen = true;
    eventConfig.groupingTabEnabled = false;
    eventConfig.challengeTabEnabled = false;
  } else if (status === 'active') {
    eventConfig.registrationOpen = true;
    eventConfig.groupingTabEnabled = true;
    eventConfig.challengeTabEnabled = true;
  } else if (status === 'completed') {
    eventConfig.registrationOpen = false;
    eventConfig.groupingTabEnabled = false;
    eventConfig.challengeTabEnabled = false;
  }

  return res.json({ success: true, data: { ...eventConfig }, message: `Event status set to '${status}'` });
}

// ── Admin: reset event ────────────────────────────────────────────────────────
// Wipes all event data (logs, pairs, awards, snapshots). Keeps users.
function resetEvent(req, res) {
  dailyLogs.splice(0, dailyLogs.length);
  pairs.splice(0, pairs.length);
  bonusAwards.splice(0, bonusAwards.length);
  leaderboardSnapshots.splice(0, leaderboardSnapshots.length);
  chitPreferences.splice(0, chitPreferences.length);

  // Reset config fields but keep eventName and time settings
  eventConfig.startDate = '';
  eventConfig.endDate = '';
  eventConfig.resultsPublished = false;
  eventConfig.registrationOpen = false;
  eventConfig.groupingTabEnabled = false;
  eventConfig.challengeTabEnabled = false;
  eventConfig.eventStatus = 'draft';

  return res.json({ success: true, data: { ...eventConfig }, message: 'Event reset. All logs, pairs, awards and snapshots cleared. Users kept.' });
}

module.exports = { getConfig, getAdminConfig, updateConfig, setEventStatus, resetEvent };
