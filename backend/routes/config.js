const router = require('express').Router();
const { getConfig, getAdminConfig, updateConfig, setEventStatus, resetEvent } = require('../controllers/configController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getConfig);
router.get('/admin', authenticate, authorize('admin'), getAdminConfig);
router.patch('/admin', authenticate, authorize('admin'), updateConfig);
router.post('/admin/status', authenticate, authorize('admin'), setEventStatus);
router.post('/admin/reset', authenticate, authorize('admin'), resetEvent);

module.exports = router;
