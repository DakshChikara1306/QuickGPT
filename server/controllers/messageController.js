import Chat from '../models/Chat.js';
import User from '../models/User.js';
import axios from 'axios';
import genAI from '../configs/Gemini.js';
import imagekit from '../configs/imagekit.js';

// ===============================
// TEXT MESSAGE CONTROLLER (GEMINI)
// ===============================
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId, prompt } = req.body;

        // ✅ validation
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required", success: false });
        }

        // ✅ find chat
        const chat = await Chat.findOne({ userId, _id: chatId });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found", success: false });
        }

        // ✅ credit check
        if (req.user.credits < 1) {
            return res.status(403).json({
                error: "Not enough credits",
                success: false
            });
        }

        // ✅ push user message
        chat.messages.push({
            role: 'user',
            content: prompt,
            timeStamp: Date.now(),
            isImage: false
        });

        // ✅ convert chat history for Gemini
        const history = chat.messages.map(msg => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
        }));

        // ✅ initialize Gemini model
        const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview"
});

        // ✅ create chat session (exclude latest msg)
        const chatSession = model.startChat({
            history: history.slice(0, -1)
        });

        // ✅ send message
        const result = await chatSession.sendMessage(prompt);
        const responseText = result?.response?.text() || "No response";

        const reply = {
            role: 'assistant',
            content: responseText,
            timeStamp: Date.now(),
            isImage: false
        };

        // ✅ save response
        chat.messages.push(reply);
        await chat.save();

        // ✅ deduct credits
        await User.updateOne(
            { _id: userId },
            { $inc: { credits: -1 } }
        );

        return res.json({
            message: reply,
            success: true
        });

    } catch (error) {
        console.error("Gemini Error:", error);

        return res.status(500).json({
            error: error.message || "Internal Server Error",
            success: false
        });
    }
};


// ===============================
// IMAGE MESSAGE CONTROLLER
// ===============================
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;
        const { prompt, chatId, isPublished } = req.body;

        // 1. Validation
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required", success: false });
        }

        // 2. Credit check
        if (req.user.credits < 2) {
            return res.status(403).json({
                error: 'Not enough credits',
                success: false
            });
        }

        // 3. Find chat
        const chat = await Chat.findOne({ userId, _id: chatId });
        if (!chat) {
            return res.status(404).json({ error: "Chat not found", success: false });
        }

        // 4. Encode prompt for URL
        const encodedPrompt = encodeURIComponent(prompt);

        // 5. Construct ImageKit Generation URL
        // Format: URL_ENDPOINT/ik-genimg-prompt-PROMPT/path/to/file.jpg
        const generateImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.jpg?tr=w-800,h-800`;

        console.log("Generating image from:", generateImageUrl);

        // 6. Fetch image as ArrayBuffer
        const aiImageResponse = await axios.get(generateImageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30 seconds timeout for AI generation
        });

        // 7. Convert Buffer to Base64 for Upload
        const base64Image = Buffer.from(aiImageResponse.data).toString('base64');

        // 8. Upload to ImageKit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `gen_${Date.now()}.png`,
            folder: "quickgpt",
            useUniqueFileName: true
        });

        // 9. Prepare Messages
        const userMsg = {
            role: 'user',
            content: prompt,
            timeStamp: Date.now(),
            isImage: false
        };

        const aiReply = {
            role: 'assistant',
            content: uploadResponse.url, // Permanent URL from ImageKit
            timeStamp: Date.now(),
            isImage: true,
            isPublished: isPublished || false
        };

        // 10. Save to Database
        chat.messages.push(userMsg);
        chat.messages.push(aiReply);
        await chat.save();

        // 11. Deduct credits
        await User.updateOne(
            { _id: userId },
            { $inc: { credits: -2 } }
        );

        return res.status(200).json({
            success: true,
            reply: aiReply
        });

    } catch (error) {
        // Detailed logging for debugging
        console.error("--- Image Generation Error ---");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data.toString());
        } else {
            console.error("Message:", error.message);
        }

        return res.status(500).json({
            error: 'Failed to generate or upload image',
            details: error.message,
            success: false
        });
    }
};