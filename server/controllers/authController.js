const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

const registerUser = async (req,res) => {
    try {
        const { name, email, password } = req.body;

        // validate input fields
        if(!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields'});
        }

        // check if email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registerd'});
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        //create user in data base 
        const user =  await user.create({
            name,
            email,
            password: hashedPassword,
        });

        // retturn new user + token
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            fitnessGoals: user.fitnessGoals,
            metrics: user.metrics,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ message: 'Server error during registration'});
    }
};

const loginUser = async (req,res) =>{
    try{
        const{ email, password } = req.body;

        //validate input fields
        if(!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password both'});
        }

        //find user by email
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(401).jason({ message: ' Invalid email or Password'});
        }
        // comapared entered password with the hassed password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({ message: 'Invalid email or Password'});
        }

        // return user data + tokern 
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            fitnessGoals: user.fitnessGoals,
            metrics: user.metrics,
            token: generateToken(user._id), 
        });
    } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login'});
    }
};

const getMe = async (req,res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        console.error('GetMe error:', error.message);
        res.status(500).json({message: 'Server error' });
    }
};
module.exports = { registerUser, loginUser,getMe };