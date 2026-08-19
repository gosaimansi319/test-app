const express = require('express');
const router = express.Router();
const { createUser, deleteUser, updateUser, getUserById, getAllUsers, deletePaginatedUsers } = require('../controllers/admin/userController');
// const upload = require('../middleware/upload');
const authorizeRole = require('../middleware/authorizeRole');
const authMiddleware = require('../middleware/authMiddleware');
const createUploader = require('../middleware/upload');
const checkPermission = require('../middleware/checkPermission');

const uploadProfile = createUploader('uploads/profile');

router.use(authMiddleware);

router.post('/create', checkPermission('user', 'create'), uploadProfile.single('image'), createUser);
router.get('/', checkPermission('user', 'read'), getAllUsers);
router.get('/:id', checkPermission('user', 'read'), getUserById);
router.put('/update/:id', checkPermission('user', 'update'), uploadProfile.single('image'), updateUser);
router.delete('/delete/:id', checkPermission('user', 'delete'), authorizeRole(['admin']), deleteUser);
router.delete('/delete-all', checkPermission('user', 'delete'), authorizeRole(['admin']), deletePaginatedUsers);

module.exports = router;
