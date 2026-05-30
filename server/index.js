const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const http       = require('http');           // ← new
const { Server } = require('socket.io');      // ← new
const connectDB  = require('./config/db');
const { initSocket } = require('./utils/socketManager'); // ← new

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);        // ← wrap express with http server

// ── Initialize Socket.io ────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin:  '*',                         // tighten this in production
        methods: ['GET', 'POST'],
    },
});
initSocket(io);

// ── Core Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/user'));
app.use('/api/workouts',      require('./routes/workout'));
app.use('/api/exercises',     require('./routes/exercise'));
app.use('/api/nutrition',     require('./routes/nutrition'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/challenges',    require('./routes/challenges'));
app.use('/api/notifications', require('./routes/notifications')); // ← uncomment

// ── Health Check ────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'Fitness App API is running' });
});

// ── 404 Handler ─────────────────────────────────────────────
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
server.listen(PORT, () => {              // ← use server.listen not app.listen
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});