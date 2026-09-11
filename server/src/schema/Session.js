import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ["Junior", "Mid", "Senior"],
      required: true,
    },
    interviewType: {
      type: String,
      enum: ["Technical", "Behavioral", "Mixed"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["openai", "anthropic", "gemini"],
      default: "openai",
    },
    questionCount: { type: Number, enum: [5, 10, 15], required: true },
    status: {
      type: String,
      enum: ["in-progress", "completed"],
      default: "in-progress",
    },
    completedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.models.Session ||
  mongoose.model("Session", sessionSchema);
