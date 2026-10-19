const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { users, dailyLogs, eventConfig, safeUser } = require('../data/inMemoryDB');

// IST = UTC+5:30
function nowIST() {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}

function toISTDateStr(date) {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split('T')[0];
}

// Returns { status, targetDate, openTime, deadlineTime }
// status: 'pre_event' | 'not_open' | 'open' | 'passed' | 'event_over' | 'no_config'
function getDeadlineStatus() {
  const ist = nowIST();
  const todayStr = ist.toISOString().split('T')[0];

  // targetDate = yesterday IST (submit previous day's steps)
  const yesterdayIST = new Date(ist);
  yesterdayIST.setUTCDate(yesterdayIST.getUTCDate() - 1);
  const targetDate = yesterdayIST.toISOString().split('T')[0];

  const openTime = eventConfig.dailyOpenTime || '06:00';
  const deadlineTime = eventConfig.dailyDeadlineTime || '23:00';

  const [openHour, openMin] = openTime.split(':').map(Number);
  const [deadHour, deadMin] = deadlineTime.split(':').map(Number);
  const currentMs = ist.getUTCHours() * 3600000 + ist.getUTCMinutes() * 60000;
  const openMs = openHour * 3600000 + openMin * 60000;
  const deadMs = deadHour * 3600000 + deadMin * 60000;

  const base = { targetDate, openTime, deadlineTime, open: false, deadlinePassed: false };

  if (!eventConfig.startDate) return { ...base, status: 'no_config' };
  if (targetDate < eventConfig.startDate) return { ...base, status: 'pre_event' };
  if (eventConfig.endDate && targetDate > eventConfig.endDate) return { ...base, status: 'event_over' };

  if (currentMs < openMs) return { ...base, status: 'not_open' };
  if (currentMs >= openMs && currentMs < deadMs) return { ...base, status: 'open', open: true };
  return { ...base, status: 'passed', deadlinePassed: true };
}

// Shared auto-zero: marks missed logs for all closed windows — safe to call repeatedly
function applyAutoZeros() {
  if (!eventConfig.startDate) return 0;
  const [deadHour, deadMin] = (eventConfig.dailyDeadlineTime || '23:00').split(':').map(Number);
  const [openHour] = (eventConfig.dailyOpenTime || '06:00').split(':').map(Number);
  const ist = nowIST();
  const currentMs = ist.getUTCHours() * 3600000 + ist.getUTCMinutes() * 60000;
  const deadMs = deadHour * 3600000 + deadMin * 60000;

  let count = 0;
  const eventStart = eventConfig.startDate;
  const eventEnd = eventConfig.endDate || eventConfig.startDate;

  for (let d = new Date(eventStart + 'T00:00:00Z'); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (dateStr > eventEnd) break;

    // Submission window for dateStr is the next day
    const submissionDayStr = new Date(d.getTime() + 86400000).toISOString().split('T')[0];
    const todayStr = ist.toISOString().split('T')[0];

    const windowClosed = todayStr > submissionDayStr ||
      (todayStr === submissionDayStr && currentMs >= deadMs);
    if (!windowClosed) break;

    for (const user of users) {
      const exists = dailyLogs.find(l => l.userId === user.id && l.logDate === dateStr);
      if (!exists) {
        dailyLogs.push({ id: uuidv4(), userId: user.id, logDate: dateStr, stepCount: 0, proofStoragePath: null, submittedAt: null, isLate: false, isDisputed: false, isAutoZero: true });
        count++;
      }
    }
  }
  return count;
}

// ── Member: get deadline status ───────────────────────────────────────────────
function checkDeadlineStatus(req, res) {
  return res.json({ success: true, data: getDeadlineStatus(), message: 'Deadline status' });
}

// ── Member: get own logs ──────────────────────────────────────────────────────
function getMyLogs(req, res) {
  const myLogs = dailyLogs.filter(l => l.userId === req.user.userId).sort((a, b) => a.logDate.localeCompare(b.logDate));
  const totalDays = myLogs.filter(l => !l.isAutoZero).length;
  const eligible = totalDays >= 14;

  let totalEventDays = 21;
  if (eventConfig.startDate && eventConfig.endDate) {
    const diff = new Date(eventConfig.endDate) - new Date(eventConfig.startDate);
    totalEventDays = Math.round(diff / 86400000) + 1;
  }

  return res.json({ success: true, data: { logs: myLogs, submittedDays: totalDays, eligible, threshold: 14, totalEventDays }, message: 'Your log history' });
}

// ── Member: submit log ────────────────────────────────────────────────────────
function submitLog(req, res) {
  if (!eventConfig.challengeTabEnabled) {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Daily log tab is not enabled yet' });
  }

  const { stepCount } = req.body;
  const proofFile = req.file;

  if (stepCount == null || stepCount === '') return res.status(400).json({ success: false, error: 'Bad Request', message: 'stepCount is required' });
  const steps = parseInt(stepCount, 10);
  if (isNaN(steps) || steps < 0) return res.status(400).json({ success: false, error: 'Bad Request', message: 'stepCount must be a non-negative integer' });

  const status = getDeadlineStatus();

  // BR-04: only allow submission when window is open
  if (status.status !== 'open') {
    const msgs = {
      no_config: 'Event not configured yet.',
      pre_event: 'Event has not started yet.',
      not_open: `Submission window opens at ${status.openTime}.`,
      passed: `Deadline passed. Log for ${status.targetDate} is locked.`,
      event_over: 'Event has ended.',
    };
    return res.status(423).json({ success: false, error: 'Locked', message: msgs[status.status] || 'Submission window is not open.' });
  }

  const logDate = status.targetDate;

  // BR-05: no back-fill (logDate must be targetDate)
  const eventStart = new Date(eventConfig.startDate);
  const logDateObj = new Date(logDate);
  if (logDateObj < eventStart) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'Log date is before event start' });
  }

  // Duplicate check
  const existing = dailyLogs.find(l => l.userId === req.user.userId && l.logDate === logDate);
  if (existing && !existing.isAutoZero) {
    return res.status(409).json({ success: false, error: 'Conflict', message: `You already submitted for ${logDate}` });
  }

  let proofStoragePath = null;
  if (proofFile) {
    // Cloudinary upload returns secure_url; disk upload gives local path
    proofStoragePath = proofFile.path || `proofs/${req.user.userId}/${logDate}${path.extname(proofFile.originalname)}`;
  }

  const newLog = {
    id: uuidv4(),
    userId: req.user.userId,
    logDate,
    stepCount: steps,
    proofStoragePath,
    submittedAt: new Date().toISOString(),
    isLate: false,
    isDisputed: false,
    isAutoZero: false,
  };

  // Replace auto-zero if exists
  if (existing && existing.isAutoZero) {
    const idx = dailyLogs.indexOf(existing);
    dailyLogs.splice(idx, 1);
  }

  dailyLogs.push(newLog);

  return res.status(201).json({ success: true, data: newLog, message: `Log submitted for ${logDate}` });
}

// ── Admin: all users × all days ───────────────────────────────────────────────
function adminGetAllLogs(req, res) {
  const eventStart = new Date(eventConfig.startDate);
  const eventEnd = new Date(eventConfig.endDate);
  const allDates = [];
  for (let d = new Date(eventStart); d <= eventEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    allDates.push(d.toISOString().split('T')[0]);
  }

  const matrix = users.map(user => {
    const userLogs = {};
    dailyLogs.filter(l => l.userId === user.id).forEach(l => { userLogs[l.logDate] = l; });
    const submittedDays = Object.values(userLogs).filter(l => !l.isAutoZero).length;
    return {
      user: safeUser(user),
      logs: allDates.map(date => userLogs[date] || { logDate: date, stepCount: null, submittedAt: null, isDisputed: false, isAutoZero: false, missing: true }),
      submittedDays,
      eligible: submittedDays >= 14,
    };
  });

  return res.json({ success: true, data: { dates: allDates, matrix }, message: 'All logs' });
}

// ── Admin: flag dispute ───────────────────────────────────────────────────────
function adminDisputeLog(req, res) {
  const { logId } = req.params;
  const { isDisputed } = req.body;
  if (typeof isDisputed !== 'boolean') {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'isDisputed must be boolean' });
  }
  const log = dailyLogs.find(l => l.id === logId);
  if (!log) return res.status(404).json({ success: false, error: 'Not Found', message: 'Log not found' });
  log.isDisputed = isDisputed;

  if (isDisputed) {
    const user = users.find(u => u.id === log.userId);
    console.log(`──── EMAIL ────\nTo:      ${user.email}\nSubject: [Walkathon] Log Entry Disputed\nBody:    Hi ${user.fullName}, your log for ${log.logDate} (${log.stepCount} steps) has been flagged for review. Please be ready to show your step tracker history.\n───────────────`);
  }

  return res.json({ success: true, data: log, message: `Log ${isDisputed ? 'flagged as disputed' : 'dispute cleared'}`, notificationSent: isDisputed });
}

// ── Admin: download proof file ────────────────────────────────────────────────
function adminGetProof(req, res) {
  const { logId } = req.params;
  const log = dailyLogs.find(l => l.id === logId);
  if (!log) return res.status(404).json({ success: false, error: 'Not Found', message: 'Log not found' });
  if (!log.proofStoragePath) return res.status(404).json({ success: false, error: 'Not Found', message: 'No proof uploaded for this log' });

  // Cloudinary URL — redirect directly
  if (log.proofStoragePath.startsWith('http')) {
    return res.redirect(log.proofStoragePath);
  }

  // Local disk path
  const filePath = path.join(__dirname, '..', 'uploads', log.proofStoragePath);
  if (!fs.existsSync(filePath)) {
    return res.json({ success: true, data: { proofStoragePath: log.proofStoragePath, note: 'File not on disk' }, message: 'Proof path info' });
  }
  res.download(filePath);
}

// ── Admin: apply auto-zeros for all missed past days ─────────────────────────
function adminApplyAutoZeros(req, res) {
  const count = applyAutoZeros();
  return res.json({ success: true, data: { autoZerosApplied: count }, message: `Applied ${count} auto-zero entries` });
}

module.exports = { checkDeadlineStatus, getMyLogs, submitLog, adminGetAllLogs, adminDisputeLog, adminGetProof, adminApplyAutoZeros, applyAutoZeros };
