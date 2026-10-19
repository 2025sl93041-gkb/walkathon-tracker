const router = require('express').Router();
const { getAllUsers, updateUser, deleteUser } = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.patch('/:userId', authenticate, authorize('admin'), updateUser);
router.delete('/:userId', authenticate, authorize('admin'), deleteUser);

module.exports = router;
