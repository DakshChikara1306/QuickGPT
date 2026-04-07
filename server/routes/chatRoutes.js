import express from 'express';
import { createChat } from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';
import { getChats } from '../controllers/chatController.js';
import { deleteChat } from '../controllers/chatController.js';

const chatRouter = express.Router();

// route for creating new chat
chatRouter.get('/create', protect, createChat);
chatRouter.get('/fetch', protect, getChats);
chatRouter.post('/delete', protect, deleteChat);


export default chatRouter;