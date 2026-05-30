const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { cloudinary } = require('../config/cloudinary');

// ─────────────────────────────────────────────────────────────
// @desc    Get a user's public profile by ID
// @route   GET /api/users/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name profilePicture')   // show follower names + pics
      .populate('following', 'name profilePicture');  // show following names + pics

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Update logged-in user's profile (name, goals, metrics)
// @route   PUT /api/users/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const updateUserProfile = async (req, res) => {
  try {
    // Users can only update their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { name, fitnessGoals, metrics } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only update fields that were actually sent
    if (name)         user.name         = name;
    if (fitnessGoals) user.fitnessGoals = fitnessGoals;
    if (metrics) {
      if (metrics.weight !== undefined) user.metrics.weight = metrics.weight;
      if (metrics.height !== undefined) user.metrics.height = metrics.height;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      _id:            updatedUser._id,
      name:           updatedUser.name,
      email:          updatedUser.email,
      profilePicture: updatedUser.profilePicture,
      fitnessGoals:   updatedUser.fitnessGoals,
      metrics:        updatedUser.metrics,
      followers:      updatedUser.followers,
      following:      updatedUser.following,
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Upload or update profile picture
// @route   POST /api/users/:id/upload
// @access  Private
// ─────────────────────────────────────────────────────────────
const uploadProfilePicture = async (req, res) => {
  try {
    // Users can only change their own picture
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If user already has a profile picture, delete the old one from Cloudinary
    if (user.profilePicture) {
      // Extract the public_id from the Cloudinary URL to delete it
      const urlParts  = user.profilePicture.split('/');
      const fileName  = urlParts[urlParts.length - 1].split('.')[0];
      const publicId  = `fitness-app/profiles/${fileName}`;
      await cloudinary.uploader.destroy(publicId);
    }

    // Save the new Cloudinary URL to the user document
    user.profilePicture = req.file.path;   // multer-storage-cloudinary puts URL in req.file.path
    await user.save();

    res.status(200).json({
      message:        'Profile picture updated',
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Upload picture error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
// ─────────────────────────────────────────────────────────────
const followUser = async (req, res) => {
  try {
    const targetUserId  = req.params.id;          // user to follow
    const currentUserId = req.user._id.toString();

    // Cannot follow yourself
    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser  = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (targetUser.followers.includes(currentUserId)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // Add currentUser to targetUser's followers list
    targetUser.followers.push(currentUserId);
    // Add targetUser to currentUser's following list
    currentUser.following.push(targetUserId);

    await targetUser.save();
    await currentUser.save();

    await createNotification({
        recipient:   targetUser._id,
        sender:      currentUserId,
        type:        'new_follower',
        referenceId: currentUserId,
        message:     `${req.user.name} started following you`,
    });

    res.status(200).json({ message: `You are now following ${targetUser.name}` });
  } catch (error) {
    console.error('Follow error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Unfollow a user
// @route   DELETE /api/users/:id/unfollow
// @access  Private
// ─────────────────────────────────────────────────────────────
const unfollowUser = async (req, res) => {
  try {
    const targetUserId  = req.params.id;
    const currentUserId = req.user._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    const targetUser  = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if actually following
    if (!targetUser.followers.includes(currentUserId)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // Remove currentUser from targetUser's followers list
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId
    );
    // Remove targetUser from currentUser's following list
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUserId
    );

    await targetUser.save();
    await currentUser.save();

    res.status(200).json({ message: `You have unfollowed ${targetUser.name}` });
  } catch (error) {
    console.error('Unfollow error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Search users by name
// @route   GET /api/users/search?q=
// @access  Private
// ─────────────────────────────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Case-insensitive search on name field
    const users = await User.find({
      name: { $regex: query, $options: 'i' },
      _id:  { $ne: req.user._id },           // exclude the logged-in user from results
    })
      .select('name profilePicture fitnessGoals')
      .limit(20);                              // cap results at 20

    res.status(200).json(users);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  followUser,
  unfollowUser,
  searchUsers,
};