const Post = require('../models/Post');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────
// @desc    Create a new post (status update only)
//          Workout posts are auto-created in workoutController
// @route   POST /api/posts
// @access  Private
// ─────────────────────────────────────────────────────────────
const createPost = async (req, res) => {
    try {
        const { caption, postType } = req.body;

        if (!caption || caption.trim() === '') {
            return res.status(400).json({ message: 'Caption is required' });
        }

        const post = await Post.create({
            user:     req.user._id,
            postType: postType || 'status',
            caption,
        });

        // Populate user info before returning
        const populatedPost = await Post.findById(post._id)
            .populate('user', 'name profilePicture');

        res.status(201).json(populatedPost);

    } catch (error) {
        console.error('Create post error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get activity feed for logged-in user
//          Shows posts from people they follow + their own posts
// @route   GET /api/posts/feed
// @access  Private
// ─────────────────────────────────────────────────────────────
const getFeed = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);

        // Build list of user IDs to show in feed
        // (everyone they follow + themselves)
        const userIds = [...currentUser.following, req.user._id];

        // Pagination support
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip  = (page - 1) * limit;

        const posts = await Post.find({ user: { $in: userIds } })
            .populate('user',             'name profilePicture')
            .populate('workout',          'title durationMinutes exercises date')
            .populate('likes',            'name profilePicture')
            .populate('comments.user',    'name profilePicture')
            .sort({ createdAt: -1 })      // newest first
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({ user: { $in: userIds } });

        res.status(200).json({
            posts,
            currentPage: page,
            totalPages:  Math.ceil(total / limit),
            totalPosts:  total,
        });

    } catch (error) {
        console.error('Get feed error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user',          'name profilePicture')
            .populate('workout',       'title durationMinutes exercises date')
            .populate('likes',         'name profilePicture')
            .populate('comments.user', 'name profilePicture');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post);

    } catch (error) {
        console.error('Get post error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get all posts by a specific user
// @route   GET /api/posts/user/:userId
// @access  Private
// ─────────────────────────────────────────────────────────────
const getUserPosts = async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.userId })
            .populate('user',          'name profilePicture')
            .populate('workout',       'title durationMinutes date')
            .populate('comments.user', 'name profilePicture')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);

    } catch (error) {
        console.error('Get user posts error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Toggle like on a post (like if not liked, unlike if liked)
// @route   PUT /api/posts/:id/like
// @access  Private
// ─────────────────────────────────────────────────────────────
const toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const userId        = req.user._id.toString();
        const alreadyLiked  = post.likes.some((id) => id.toString() === userId);

        if (alreadyLiked) {
            // Unlike — remove user from likes array
            post.likes = post.likes.filter((id) => id.toString() !== userId);
        } else {
            // Like — add user to likes array
            post.likes.push(req.user._id);
        }

        await post.save();

        res.status(200).json({
            message:    alreadyLiked ? 'Post unliked' : 'Post liked',
            totalLikes: post.likes.length,
            liked:      !alreadyLiked,
        });

    } catch (error) {
        console.error('Toggle like error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
// ─────────────────────────────────────────────────────────────
const addComment = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Add the new comment
        post.comments.push({
            user: req.user._id,
            text: text.trim(),
        });

        await post.save();

        // Repopulate and return the updated post
        const updatedPost = await Post.findById(post._id)
            .populate('user',          'name profilePicture')
            .populate('comments.user', 'name profilePicture');

        res.status(201).json(updatedPost);

    } catch (error) {
        console.error('Add comment error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Delete a comment from a post
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only comment owner or post owner can delete a comment
        const isCommentOwner = comment.user.toString() === req.user._id.toString();
        const isPostOwner    = post.user.toString()    === req.user._id.toString();

        if (!isCommentOwner && !isPostOwner) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        post.comments = post.comments.filter(
            (c) => c._id.toString() !== req.params.commentId
        );

        await post.save();
        res.status(200).json({ message: 'Comment deleted successfully' });

    } catch (error) {
        console.error('Delete comment error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Only the post owner can delete it
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.status(200).json({ message: 'Post deleted successfully' });

    } catch (error) {
        console.error('Delete post error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createPost,
    getFeed,
    getPostById,
    getUserPosts,
    toggleLike,
    addComment,
    deleteComment,
    deletePost,
};