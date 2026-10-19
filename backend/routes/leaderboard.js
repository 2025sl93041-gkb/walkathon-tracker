const router = require('express').Router();
const { getLeaderboard, adminRecalculate, adminGetSnapshots } = require('../controllers/leaderboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getLeaderboard);
router.get('/admin/snapshots', authenticate, authorize('admin'), adminGetSnapshots);
router.post('/admin/recalculate', authenticate, authorize('admin'), adminRecalculate);

module.exports = router;
