// 🔹 Models
import Chat from "../models/Chat.js";

// =========================================================
// 🆕 Create New Chat
// Creates an empty chat for the logged-in user
// =========================================================
export const createChat = async (req, res) => {
  try {
    const userId = req.user._id;

    const chatData = {
      userId,
      messages: [],
      name: "New Chat",
      userName: req.user.name,
    };

    await Chat.create(chatData);

    res.status(201).json({
      success: true,
      message: "Chat created successfully",
    });
  } catch (error) {
    console.error("Error creating chat:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// 📥 Get All Chats
// Fetches all chats for the logged-in user
// =========================================================
export const getChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// 🗑 Delete Chat
// Deletes a chat only if it belongs to the user
// =========================================================
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId } = req.body;

    const deletedChat = await Chat.findOneAndDelete({
      _id: chatId,
      userId,
    });

    // ❌ Chat not found or unauthorized
    if (!deletedChat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};