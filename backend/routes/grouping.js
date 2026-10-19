const router = require('express').Router();
const { getPoolStatus, getMyPair, performDraw, adminGetGrouping, adminMovePool, adminToggleExclude, adminCreatePair, adminBreakPair } = require('../controllers/groupingController');
const { authenticate, authorize } = require('../middleware/auth');

// Member routes
router.get('/status', authenticate, getPoolStatus);
router.get('/my-pair', authenticate, getMyPair);
router.post('/draw', authenticate, performDraw);

// Admin routes
router.get('/admin', authenticate, authorize('admin'), adminGetGrouping);
router.patch('/admin/preferences/:userId', authenticate, authorize('admin'), adminMovePool);
router.patch('/admin/exclude/:userId', authenticate, authorize('admin'), adminToggleExclude);
router.post('/admin/pairs', authenticate, authorize('admin'), adminCreatePair);
router.delete('/admin/pairs/:pairId', authenticate, authorize('admin'), adminBreakPair);

module.exports = router;
