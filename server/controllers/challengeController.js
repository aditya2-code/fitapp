const Challenge = require('../models/Challenge');
const Workout   = require('../models/Workout');

// ─────────────────────────────────────────────────────────────
// @desc    Create a new challenge
// @route   POST /api/challenges
// @access  Private
// ─────────────────────────────────────────────────────────────
const createChallenge = async (req, res) => {
    try {
        const { title, description, metric, startDate, endDate } = req.body;

        // Validate required fields
        if (!title || !startDate || !endDate) {
            return res.status(400).json({
                message: 'Title, start date and end date are required',
            });
        }

        // Validate dates
        const start = new Date(startDate);
        const end   = new Date(endDate);

        if (end <= start) {
            return res.status(400).json({
                message: 'End date must be after start date',
            });
        }

        const challenge = await Challenge.create({
            title,
            description: description || '',
            createdBy:   req.user._id,
            metric:      metric || 'total_workouts',
            startDate:   start,
            endDate:     end,
            isActive:    true,
            // Creator automatically joins the challenge
            participants: [{ user: req.user._id, score: 0 }],
        });

        const populated = await Challenge.findById(challenge._id)
            .populate('createdBy',            'name profilePicture')
            .populate('participants.user',     'name profilePicture');

        res.status(201).json(populated);

    } catch (error) {
        console.error('Create challenge error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get all active challenges
// @route   GET /api/challenges
// @access  Private
// ─────────────────────────────────────────────────────────────
const getChallenges = async (req, res) => {
    try {
        const now = new Date();

        // Auto-deactivate challenges that have passed their end date
        await Challenge.updateMany(
            { endDate: { $lt: now }, isActive: true },
            { isActive: false }
        );

        const filter = {};

        // Optional filter: ?status=active or ?status=inactive
        if (req.query.status === 'active') {
            filter.isActive = true;
        } else if (req.query.status === 'inactive') {
            filter.isActive = false;
        }

        const challenges = await Challenge.find(filter)
            .populate('createdBy',        'name profilePicture')
            .populate('participants.user', 'name profilePicture')
            .sort({ createdAt: -1 });

        res.status(200).json(challenges);

    } catch (error) {
        console.error('Get challenges error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get a single challenge by ID
// @route   GET /api/challenges/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getChallengeById = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id)
            .populate('createdBy',        'name profilePicture')
            .populate('participants.user', 'name profilePicture');

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        res.status(200).json(challenge);

    } catch (error) {
        console.error('Get challenge error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Join a challenge
// @route   POST /api/challenges/:id/join
// @access  Private
// ─────────────────────────────────────────────────────────────
const joinChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        if (!challenge.isActive) {
            return res.status(400).json({ message: 'This challenge is no longer active' });
        }

        // Check if challenge has already ended
        if (new Date() > new Date(challenge.endDate)) {
            return res.status(400).json({ message: 'This challenge has already ended' });
        }

        // Check if user already joined
        const alreadyJoined = challenge.participants.some(
            (p) => p.user.toString() === req.user._id.toString()
        );

        if (alreadyJoined) {
            return res.status(400).json({ message: 'You have already joined this challenge' });
        }

        challenge.participants.push({ user: req.user._id, score: 0 });
        await challenge.save();

        const populated = await Challenge.findById(challenge._id)
            .populate('participants.user', 'name profilePicture');

        res.status(200).json({
            message:   `You have joined "${challenge.title}"`,
            challenge: populated,
        });

    } catch (error) {
        console.error('Join challenge error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Leave a challenge
// @route   DELETE /api/challenges/:id/leave
// @access  Private
// ─────────────────────────────────────────────────────────────
const leaveChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Creator cannot leave their own challenge
        if (challenge.createdBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Challenge creator cannot leave. Delete the challenge instead.' });
        }

        const isParticipant = challenge.participants.some(
            (p) => p.user.toString() === req.user._id.toString()
        );

        if (!isParticipant) {
            return res.status(400).json({ message: 'You are not part of this challenge' });
        }

        challenge.participants = challenge.participants.filter(
            (p) => p.user.toString() !== req.user._id.toString()
        );

        await challenge.save();
        res.status(200).json({ message: `You have left "${challenge.title}"` });

    } catch (error) {
        console.error('Leave challenge error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Submit a workout to a challenge (updates score)
// @route   POST /api/challenges/:id/submit
// @access  Private
// ─────────────────────────────────────────────────────────────
const submitWorkout = async (req, res) => {
    try {
        const { workoutId } = req.body;

        if (!workoutId) {
            return res.status(400).json({ message: 'workoutId is required' });
        }

        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        if (!challenge.isActive) {
            return res.status(400).json({ message: 'This challenge is no longer active' });
        }

        // Check if challenge is still running
        const now = new Date();
        if (now < new Date(challenge.startDate)) {
            return res.status(400).json({ message: 'This challenge has not started yet' });
        }
        if (now > new Date(challenge.endDate)) {
            return res.status(400).json({ message: 'This challenge has already ended' });
        }

        // Find the participant entry
        const participantIndex = challenge.participants.findIndex(
            (p) => p.user.toString() === req.user._id.toString()
        );

        if (participantIndex === -1) {
            return res.status(400).json({ message: 'You must join the challenge first' });
        }

        // Fetch the workout to calculate score
        const workout = await Workout.findById(workoutId);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Make sure this workout belongs to the user
        if (workout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to submit this workout' });
        }

        // ── Calculate score based on challenge metric ──────────
        let scoreToAdd = 0;

        if (challenge.metric === 'total_workouts') {
            scoreToAdd = 1;                                  // 1 point per workout
        } else if (challenge.metric === 'total_minutes') {
            scoreToAdd = workout.durationMinutes || 0;       // points = minutes logged
        } else if (challenge.metric === 'challenge_points') {
            // Points = total number of sets across all exercises
            scoreToAdd = workout.exercises.reduce(
                (acc, ex) => acc + ex.sets.length, 0
            );
        }

        // Add score to participant
        challenge.participants[participantIndex].score += scoreToAdd;
        await challenge.save();

        const populated = await Challenge.findById(challenge._id)
            .populate('participants.user', 'name profilePicture');

        res.status(200).json({
            message:    `Score updated! +${scoreToAdd} points`,
            newScore:   challenge.participants[participantIndex].score,
            challenge:  populated,
        });

    } catch (error) {
        console.error('Submit workout error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get ranked leaderboard for a challenge
// @route   GET /api/challenges/:id/leaderboard
// @access  Private
// ─────────────────────────────────────────────────────────────
const getLeaderboard = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id)
            .populate('participants.user', 'name profilePicture');

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        // Sort participants by score descending
        const ranked = challenge.participants
            .slice()                               // copy array to avoid mutating document
            .sort((a, b) => b.score - a.score)
            .map((participant, index) => ({
                rank:     index + 1,
                user:     participant.user,
                score:    participant.score,
                joinedAt: participant.joinedAt,
                // Flag so frontend can highlight the current user's row
                isCurrentUser:
                    participant.user._id.toString() === req.user._id.toString(),
            }));

        res.status(200).json({
            challengeId:    challenge._id,
            challengeTitle: challenge.title,
            metric:         challenge.metric,
            isActive:       challenge.isActive,
            startDate:      challenge.startDate,
            endDate:        challenge.endDate,
            totalParticipants: ranked.length,
            leaderboard:    ranked,
        });

    } catch (error) {
        console.error('Leaderboard error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Delete a challenge (creator only)
// @route   DELETE /api/challenges/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        if (challenge.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this challenge' });
        }

        await challenge.deleteOne();
        res.status(200).json({ message: 'Challenge deleted successfully' });

    } catch (error) {
        console.error('Delete challenge error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createChallenge,
    getChallenges,
    getChallengeById,
    joinChallenge,
    leaveChallenge,
    submitWorkout,
    getLeaderboard,
    deleteChallenge,
};