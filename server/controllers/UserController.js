import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Chat from '../models/Chat.js';

// generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

//api to register a user
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        //check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        //create new user
        const newUser  = await User.create({ name, email, password });
        const token = generateToken(newUser._id);
        res.status(201).json({ success: true, token });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

//api to login a user
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        //check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        //check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = generateToken(user._id);
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}   

// api to get user details
export const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Server error' });
    }
}   

// api to give published images
export const getPublishedImages = async (req, res) => {
    try{
        const publishesImageMessages = await Chat.aggregate([
            
            { $unwind: "$messages" },
            { $match: { "messages.isPublished": true, "messages.isImage": true } },
            { $project: { _id: 0, imageUrl: "$messages.content", userName: "$userName" } }
        ])
        res.status(200).json({ success: true, images: publishesImageMessages.reverse() });

    }catch(error){
        console.error('Error fetching published images:', error);
        res.status(500).json({ message: 'Server error' });
    }
}