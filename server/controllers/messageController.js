// 🔹 Models
import Chat from "../models/Chat.js";
import User from "../models/User.js";

// 🔹 External Services
import axios from "axios";
import genAI from "../configs/Gemini.js";
import imagekit from "../configs/imageKit.js";

// =========================================================
// 💬 TEXT MESSAGE CONTROLLER (Gemini)
// Handles text-based AI responses
// =========================================================
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, prompt } = req.body;

    // 🔍 Validation
    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
        success: false,
      });
    }

    // 🔍 Find chat
    const chat = await Chat.findOne({
      userId,
      _id: chatId,
    });

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found",
        success: false,
      });
    }

    // 💳 Credit check
    if (req.user.credits < 1) {
      return res.status(403).json({
        error: "Not enough credits",
        success: false,
      });
    }

    // 📝 Push user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timeStamp: Date.now(),
      isImage: false,
    });

    // 🔄 Convert chat history for Gemini format
    const history = chat.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 🤖 Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    // 💬 Start chat session (exclude latest message)
    const chatSession = model.startChat({
      history: history.slice(0, -1),
    });

    // 🚀 Send prompt to AI
    const result = await chatSession.sendMessage(prompt);

    const responseText =
      result?.response?.text() || "No response";

    const reply = {
      role: "assistant",
      content: responseText,
      timeStamp: Date.now(),
      isImage: false,
    };

    // 💾 Save AI response
    chat.messages.push(reply);
    await chat.save();

    // 💳 Deduct credits
    await User.updateOne(
      { _id: userId },
      { $inc: { credits: -1 } }
    );

    return res.json({
      message: reply,
      success: true,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    return res.status(500).json({
      error: error.message || "Internal Server Error",
      success: false,
    });
  }
};

// =========================================================
// 🖼 IMAGE MESSAGE CONTROLLER
// Generates AI image and uploads to ImageKit
// =========================================================
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { prompt, chatId, isPublished } = req.body;

    // 🔍 Validation
    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
        success: false,
      });
    }

    // 💳 Credit check
    if (req.user.credits < 2) {
      return res.status(403).json({
        error: "Not enough credits",
        success: false,
      });
    }

    // 🔍 Find chat
    const chat = await Chat.findOne({
      userId,
      _id: chatId,
    });

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found",
        success: false,
      });
    }

    // 🔐 Encode prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);

    // 🌐 Generate ImageKit AI URL
    const generateImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.jpg?tr=w-800,h-800`;

    console.log("Generating image from:", generateImageUrl);

    // 📥 Fetch generated image
    const aiImageResponse = await axios.get(generateImageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    // 🔄 Convert to base64
    const base64Image = Buffer.from(
      aiImageResponse.data
    ).toString("base64");

    // ☁️ Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `gen_${Date.now()}.png`,
      folder: "quickgpt",
      useUniqueFileName: true,
    });

    // 📝 Prepare messages
    const userMsg = {
      role: "user",
      content: prompt,
      timeStamp: Date.now(),
      isImage: false,
    };

    const aiReply = {
      role: "assistant",
      content: uploadResponse.url,
      timeStamp: Date.now(),
      isImage: true,
      isPublished: isPublished || false,
    };

    // 💾 Save to DB
    chat.messages.push(userMsg);
    chat.messages.push(aiReply);
    await chat.save();

    // 💳 Deduct credits
    await User.updateOne(
      { _id: userId },
      { $inc: { credits: -2 } }
    );

    return res.status(200).json({
      success: true,
      reply: aiReply,
    });
  } catch (error) {
    // 🪵 Detailed logging
    console.error("--- Image Generation Error ---");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error(
        "Data:",
        error.response.data.toString()
      );
    } else {
      console.error("Message:", error.message);
    }

    return res.status(500).json({
      error: "Failed to generate or upload image",
      details: error.message,
      success: false,
    });
  }
};