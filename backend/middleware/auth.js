const jwt = require('jsonwebtoken');
const { users } = require('../data/inMemoryDB');

require('dotenv').config();
const SECRET = process.env.JWT_SECRET || 'walkathon_secret_key';

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    const user = users.find(u => u.id === payload.userId);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized', message: 'User not found' });
    req.user = { userId: user.id, role: user.role, email: user.email, fullName: user.fullName };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden', message: `Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

module.exports = { authenticate, authorize, SECRET };
