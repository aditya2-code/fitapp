const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables first, before anything else
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ── Core Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());             // parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // parse form data

// ── Routes (you will uncomment these as you build each phase) ──
 app.use('/api/auth',require('./routes/auth'));
 app.use('/api/users',require('./routes/user'));
 app.use('/api/workouts',   require('./routes/workout'));
 app.use('/api/exercises',  require('./routes/exercise'));
// app.use('/api/nutrition',  require('./routes/nutrition'));
// app.use('/api/posts',      require('./routes/posts'));
// app.use('/api/challenges', require('./routes/challenges'));
// app.use('/api/notifications', require('./routes/notifications'));

// ── Health Check Route ──────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Fitness App API is running' });
});

// ── 404 Handler (unknown routes) ───────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
});

// ── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});