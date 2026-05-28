const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

// ─────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ── 1. Validate input fields ───────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // ── 2. Check if email is already registered ────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // ── 3. Hash the password ───────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── 4. Create the user in the database ─────────────────
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // ── 5. Return the new user + token ─────────────────────
    res.status(201).json({
      _id:            user._id,
      name:           user.name,
      email:          user.email,
      profilePicture: user.profilePicture,
      fitnessGoals:   user.fitnessGoals,
      metrics:        user.metrics,
      token:          generateToken(user._id),
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── 1. Validate input fields ───────────────────────────
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // ── 2. Find user by email ──────────────────────────────
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ── 3. Compare entered password with hashed password ───
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ── 4. Return user data + token ────────────────────────
    res.status(200).json({
      _id:            user._id,
      name:           user.name,
      email:          user.email,
      profilePicture: user.profilePicture,
      fitnessGoals:   user.fitnessGoals,
      metrics:        user.metrics,
      token:          generateToken(user._id),
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get currently logged-in user's data
// @route   GET /api/auth/me
// @access  Private (requires token)
// ─────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // req.user is attached by the protect middleware
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json(user);
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, getMe };