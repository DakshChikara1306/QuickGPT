// 🔹 Auth
import jwt from "jsonwebtoken";

// 🔹 Models
import User from "../models/User.js";

// =========================================================
// 🔐 Protect Middleware
// Verifies JWT and attaches user to request
// =========================================================
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // =====================================================
    // ❗ Step 1: Check Authorization header
    // =====================================================
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // =====================================================
    // ❗ Step 2: Extract token
    // =====================================================
    const token = authHeader.split(" ")[1];

    // =====================================================
    // ❗ Step 3: Verify token
    // =====================================================
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =====================================================
    // ❗ Step 4: Fetch user from DB
    // =====================================================
    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);

    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};