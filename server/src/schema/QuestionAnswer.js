import mongoose from "mongoose";

const questionAnswerSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      index: true,
    },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["technical", "behavioral"],
      required: true,
    },
    userAnswer: { type: String, default: "" },
    answerMethod: { type: String, enum: ["text", "voice"], default: "text" },
    score: { type: Number, min: 0, max: 10, default: null },
    feedback: {
      clarity: String,
      depth: String,
      structure: String,
      modelAnswer: String,
    },
  },
  { timestamps: true },
);

export default mongoose.models.QuestionAnswer ||
  mongoose.model("QuestionAnswer", questionAnswerSchema);
