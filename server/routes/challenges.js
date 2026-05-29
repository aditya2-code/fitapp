const express = require('express');
const router  = express.Router();
const {
    createChallenge,
    getChallenges,
    getChallengeById,
    joinChallenge,
    leaveChallenge,
    submitWorkout,
    getLeaderboard,
    deleteChallenge,
} = require('../controllers/challengeController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',                  protect, createChallenge);   // POST   /api/challenges
router.get('/',                   protect, getChallenges);     // GET    /api/challenges
router.get('/:id',                protect, getChallengeById);  // GET    /api/challenges/:id
router.post('/:id/join',          protect, joinChallenge);     // POST   /api/challenges/:id/join
router.delete('/:id/leave',       protect, leaveChallenge);    // DELETE /api/challenges/:id/leave
router.post('/:id/submit',        protect, submitWorkout);     // POST   /api/challenges/:id/submit
router.get('/:id/leaderboard',    protect, getLeaderboard);    // GET    /api/challenges/:id/leaderboard
router.delete('/:id',             protect, deleteChallenge);   // DELETE /api/challenges/:id

module.exports = router;