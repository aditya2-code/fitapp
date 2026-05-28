const express = require('express');
const router  = express.Router();

const {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  followUser,
  unfollowUser,
  searchUsers,
} = require('../controllers/userController');

const { protect }              = require('../middleware/authMiddleware');
const { uploadProfilePicture: uploadMiddleware } = require('../middleware/uploadMiddleware');

// All routes below are protected — JWT required
router.get('/search',          protect, searchUsers);           // GET /api/users/search?q=
router.get('/:id',             protect, getUserProfile);        // GET /api/users/:id
router.put('/:id',             protect, updateUserProfile);     // PUT /api/users/:id
router.post('/:id/upload',     protect, uploadMiddleware, uploadProfilePicture); // POST /api/users/:id/upload
router.post('/:id/follow',     protect, followUser);            // POST /api/users/:id/follow
router.delete('/:id/unfollow', protect, unfollowUser);          // DELETE /api/users/:id/unfollow

module.exports = router;