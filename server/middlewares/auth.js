import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// middleware to protect routes

export const protect = async (req, res, next) => {
    let token = req.headers.authorization;

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const UserId = decoded.id; 
        const user = await User.findById(UserId)

        if(!user){
            return res.status(404).json({success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    }catch(error){
        console.error('Error occurred while protecting route:', error);
        res.status(401).json({ message: 'Unauthorized' });
    }
}
