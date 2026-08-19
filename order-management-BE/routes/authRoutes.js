const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, getUserDetails, updateUserProfile } = require('../controllers/admin/authController');
const authMiddleware = require('../middleware/authMiddleware');
const createUploader = require('../middleware/upload');

const uploadProfile = createUploader('uploads/profile');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/user-details', authMiddleware, getUserDetails);
router.patch('/update-profile', authMiddleware, uploadProfile.single('image'), updateUserProfile);

module.exports = router;
