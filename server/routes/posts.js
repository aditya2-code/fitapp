const express = require('express');
const router  = express.Router();
const {
    createPost,
    getFeed,
    getPostById,
    getUserPosts,
    toggleLike,
    addComment,
    deleteComment,
    deletePost,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',                         protect, createPost);    // POST   /api/posts
router.get('/feed',                      protect, getFeed);       // GET    /api/posts/feed
router.get('/user/:userId',              protect, getUserPosts);  // GET    /api/posts/user/:userId
router.get('/:id',                       protect, getPostById);   // GET    /api/posts/:id
router.put('/:id/like',                  protect, toggleLike);    // PUT    /api/posts/:id/like
router.post('/:id/comment',              protect, addComment);    // POST   /api/posts/:id/comment
router.delete('/:id/comment/:commentId', protect, deleteComment); // DELETE /api/posts/:id/comment/:commentId
router.delete('/:id',                    protect, deletePost);    // DELETE /api/posts/:id

module.exports = router;