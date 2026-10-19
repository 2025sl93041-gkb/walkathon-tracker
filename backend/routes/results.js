const router = require('express').Router();
const { getResults, adminPreviewResults, adminPublishResults, adminUnpublishResults, adminAddBonusAward, adminRemoveBonusAward, adminListBonusAwards } = require('../controllers/resultsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getResults);
router.get('/admin/preview', authenticate, authorize('admin'), adminPreviewResults);
router.get('/admin/bonus-awards', authenticate, authorize('admin'), adminListBonusAwards);
router.post('/admin/publish', authenticate, authorize('admin'), adminPublishResults);
router.post('/admin/unpublish', authenticate, authorize('admin'), adminUnpublishResults);
router.post('/admin/bonus-awards', authenticate, authorize('admin'), adminAddBonusAward);
router.delete('/admin/bonus-awards/:awardId', authenticate, authorize('admin'), adminRemoveBonusAward);

module.exports = router;
