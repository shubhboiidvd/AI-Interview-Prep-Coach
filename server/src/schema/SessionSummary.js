import mongoose from "mongoose";

const sessionSummarySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true,
    },
    averageScore: { type: Number, min: 0, max: 10 },
    strongestArea: String,
    weakestArea: String,
    improvementSuggestions: [String],
  },
  { timestamps: true },
);

export default mongoose.models.SessionSummary ||
  mongoose.model("SessionSummary", sessionSummarySchema);
