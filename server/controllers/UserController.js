// 🔹 Models
import User from "../models/User.js";
import Chat from "../models/Chat.js";

// 🔹 Auth & Security
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// =========================================================
// 🔐 Generate JWT Token
// =========================================================
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// =========================================================
// 📝 Register User
// Creates a new user and returns JWT token
// =========================================================
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // 🔍 Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // 🆕 Create new user
    const newUser = await User.create({
      name,
      email,
      password,
    });

    // 🔐 Generate token
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// 🔑 Login User
// Verifies credentials and returns JWT token
// =========================================================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 🔍 Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 🔐 Compare password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 🔐 Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("Error logging in user:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// 👤 Get User Details
// Returns authenticated user (without password)
// =========================================================
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =========================================================
// 🌍 Get Published Images
// Aggregates all publicly shared images
// =========================================================
export const getPublishedImages = async (req, res) => {
  try {
    const publishesImageMessages = await Chat.aggregate([
      // 🔄 Flatten messages array
      { $unwind: "$messages" },

      // 🔍 Filter published image messages
      {
        $match: {
          "messages.isPublished": true,
          "messages.isImage": true,
        },
      },

      // 📦 Shape response
      {
        $project: {
          _id: 0,
          imageUrl: "$messages.content",
          userName: "$userName",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      images: publishesImageMessages.reverse(),
    });
  } catch (error) {
    console.error(
      "Error fetching published images:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};