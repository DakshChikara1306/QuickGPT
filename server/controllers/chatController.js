import Chat from '../models/Chat.js';

// api controller for creating new chat
export const createChat = async (req, res) => {
    try{
        const userId = req.user._id;
        const chatData = {
            userId,
            messages : [],
            name:"New Chat",
            userName : req.user.name
        }
        await Chat.create(chatData);
        res.status(201).json({ success: true, message: 'Chat created successfully' });  
        }

     catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// api controller for fetching all chats of a user
export const getChats = async (req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, chats });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

// api controller for deleting a chat
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId } = req.params;
        await Chat.findOneAndDelete({ _id: chatId, userId });
        res.status(200).json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
}