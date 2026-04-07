import express from 'express';
import { registerUser } from '../controllers/UserController.js';
import { loginUser } from '../controllers/UserController.js';
import { getUserDetails } from '../controllers/UserController.js';
import { protect } from '../middlewares/auth.js'; 
import { getPublishedImages } from '../controllers/UserController.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/data', protect, getUserDetails);
userRouter.get('/published-images', getPublishedImages);

export default userRouter;