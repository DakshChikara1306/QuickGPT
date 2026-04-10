import express from "express";
import cors from "cors";
import "dotenv/config";

// 🔹 DB
import connectDB from "./configs/db.js";

// 🔹 Routes
import userRouter from "./routes/userRoutes.js";
import chatRouter from "./routes/chatRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import creditRouter from "./routes/creditRoutes.js";

// 🔹 Webhooks
import { stripeWebhooks } from "./controllers/webhooks.js";

const app = express();

// =========================================================
// 🔌 Connect to Database
// =========================================================
await connectDB();

// =========================================================
// 🔔 Stripe Webhook Route
// Must be before express.json() (raw body required)
// =========================================================
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// =========================================================
// ⚙️ Middlewares
// =========================================================
app.use(cors());
app.use(express.json());

// =========================================================
// 🏠 Health Check Route
// =========================================================
app.get("/", (req, res) => {
  res.send("Server is Live!");
});

// =========================================================
// 📡 API Routes
// =========================================================
app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/credit", creditRouter);

// =========================================================
// 🚀 Start Server
// =========================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});