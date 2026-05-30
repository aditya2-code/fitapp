let io;

// Called once from index.js to attach socket.io to the server
const initSocket = (socketIo) => {
    io = socketIo;

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Each user joins their own private room using their userId
        // Frontend calls: socket.emit('join', userId)
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        // User joins a challenge room for live leaderboard updates
        // Frontend calls: socket.emit('joinChallenge', challengeId)
        socket.on('joinChallenge', (challengeId) => {
            socket.join(`challenge_${challengeId}`);
            console.log(`Socket joined challenge room: challenge_${challengeId}`);
        });

        // User leaves a challenge room
        socket.on('leaveChallenge', (challengeId) => {
            socket.leave(`challenge_${challengeId}`);
            console.log(`Socket left challenge room: challenge_${challengeId}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });
};

// ── Emit functions called from controllers ─────────────────────

// Send a notification to a specific user's private room
const sendNotification = (userId, notification) => {
    if (io) {
        io.to(userId.toString()).emit('notification', notification);
    }
};

// Broadcast updated leaderboard to everyone in a challenge room
const updateLeaderboard = (challengeId, leaderboardData) => {
    if (io) {
        io.to(`challenge_${challengeId}`).emit(
            'leaderboard:update',
            leaderboardData
        );
    }
};

module.exports = { initSocket, sendNotification, updateLeaderboard };