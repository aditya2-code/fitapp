const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Helth Check Route
app.get('/',(req,res) => {
    res.json({message: 'Fitness App is running'});
});

// 404 hendler
app.get((req,res) => {
    res.status(404).json({ message: 'Route not found'});
});

// Global Error handler
app.use((err,req,res,next) => {
    console.error(err.stack);
    res.status(500).json({
        message:err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,() =>{
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});