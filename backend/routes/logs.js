const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { checkDeadlineStatus, getMyLogs, submitLog, adminGetAllLogs, adminDisputeLog, adminGetProof, adminApplyAutoZeros } = require('../controllers/logsController');
const { authenticate, authorize } = require('../middleware/auth');

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder: `walkathon-2026/proofs`,
      public_id: `${req.user.userId}_${new Date().toISOString().split('T')[0]}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    }),
  });
} else {
  // Local disk fallback (dev only)
  storage = multer.diskStorage({
    destination(req, file, cb) {
      const dir = path.join(__dirname, '..', 'uploads', 'proofs', req.user.userId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename(req, file, cb) {
      cb(null, file.originalname);
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only jpg/png/gif/pdf allowed'));
  },
});

// Member routes
router.get('/deadline-status', authenticate, checkDeadlineStatus);
router.get('/my', authenticate, getMyLogs);
router.post('/', authenticate, upload.single('proof'), submitLog);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), adminGetAllLogs);
router.patch('/admin/:logId/dispute', authenticate, authorize('admin'), adminDisputeLog);
router.get('/admin/:logId/proof', authenticate, authorize('admin'), adminGetProof);
router.post('/admin/apply-zeros', authenticate, authorize('admin'), adminApplyAutoZeros);

module.exports = router;
