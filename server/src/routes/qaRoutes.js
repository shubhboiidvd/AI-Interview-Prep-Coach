import express from "express";
import rateLimit from "express-rate-limit";
import { body, param } from "express-validator";
import QuestionAnswer from "../schema/QuestionAnswer.js";
import Session from "../schema/Session.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, handleValidation } from "../middleware/validation.js";
import { evaluateAnswer } from "../services/aiService.js";

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 30 });
router.post(
  "/:id/rescore",
  requireAuth,
  limiter,
  [
    param("id").isMongoId(),
    body("provider").isIn(["openai", "anthropic", "gemini"]),
    handleValidation,
  ],
  asyncHandler(async (request, response) => {
    const qa = await QuestionAnswer.findById(request.params.id);
    if (!qa) return response.status(404).json({ message: "Answer not found" });
    const session = await Session.findOne({
      _id: qa.sessionId,
      userId: request.user._id,
    });
    if (!session)
      return response.status(404).json({ message: "Session not found" });
    qa.feedback = await evaluateAnswer(
      qa.questionText,
      qa.userAnswer,
      session.role,
      session.difficulty,
      request.body.provider,
    );
    qa.score = qa.feedback.score;
    await qa.save();
    response.json(qa);
  }),
);
export default router;
