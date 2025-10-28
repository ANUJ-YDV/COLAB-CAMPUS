import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

console.log("Environment variables loaded:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ Loaded" : "✗ Missing");
console.log("PORT:", process.env.PORT || "Using default 5000");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✓ Loaded" : "✗ Missing");

const app = express();

app.use(cors());
app.use(express.json());

// Connect Auth Routes
app.use("/api/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error(" MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.json({ message: "API is running successfully!" });
});

app.get("/api/test", (req, res) => {
  res.json({ success: true, data: "This is your first API endpoint." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
