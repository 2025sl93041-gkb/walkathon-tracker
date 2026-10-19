const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { users, chitPreferences, eventConfig, safeUser } = require('../data/inMemoryDB');
const { SECRET } = require('../middleware/auth');

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || '';

function register(req, res) {
  const { fullName, email, phoneNumber, employeeId, password, chitPreference } = req.body;

  if (!fullName || !email || !phoneNumber || !password || !chitPreference) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'Missing required fields: fullName, email, phoneNumber, password, chitPreference' });
  }

  // BR-03: registration gate
  if (!eventConfig.registrationOpen) {
    return res.status(403).json({ success: false, error: 'Forbidden', message: 'Registration is currently closed' });
  }

  // BR-01: optional domain restriction (set ALLOWED_EMAIL_DOMAIN env var to restrict)
  if (ALLOWED_DOMAIN && !email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: `Only @${ALLOWED_DOMAIN} email addresses are allowed` });
  }

  // Duplicate email
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'Conflict', message: 'Email already registered' });
  }

  // BR-02: unique employee ID (optional field)
  if (employeeId && users.find(u => u.employeeId === employeeId)) {
    return res.status(409).json({ success: false, error: 'Conflict', message: 'Employee ID already registered' });
  }

  // Validate chit preference
  if (!['draw', 'be_drawn'].includes(chitPreference)) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'chitPreference must be "draw" or "be_drawn"' });
  }

  const userId = uuidv4();
  const newUser = {
    id: userId,
    fullName,
    email,
    phoneNumber,
    employeeId: employeeId || null,
    role: 'member',
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);

  chitPreferences.push({ id: uuidv4(), userId, preference: chitPreference, isAvailable: true, excludedFromDraw: false });

  const token = jwt.sign({ userId, role: 'member', email }, SECRET, { expiresIn: '24h' });

  console.log(`──── EMAIL ────\nTo:      ${email}\nSubject: Welcome to ${eventConfig.eventName}!\nBody:    Hi ${fullName}, you're registered! Your chit draw preference is "${chitPreference}". Stay tuned for the event start.\n───────────────`);

  return res.status(201).json({ success: true, data: { user: safeUser(newUser), token }, message: 'Registration successful', notificationSent: true, to: email, subject: `Welcome to ${eventConfig.eventName}!` });
}

function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Bad Request', message: 'email and password required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: '24h' });
  return res.json({ success: true, data: { user: safeUser(user), token }, message: 'Login successful' });
}

function me(req, res) {
  const user = users.find(u => u.id === req.user.userId);
  return res.json({ success: true, data: safeUser(user), message: 'Current user' });
}

module.exports = { register, login, me };
