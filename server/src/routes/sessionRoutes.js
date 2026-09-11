import express from "express";
import rateLimit from "express-rate-limit";
import { body, param } from "express-validator";
import Session from "../schema/Session.js";
import QuestionAnswer from "../schema/QuestionAnswer.js";
import SessionSummary from "../schema/SessionSummary.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler, handleValidation } from "../middleware/validation.js";
import {
  evaluateAnswer,
  generateQuestion,
  generateSessionSummary,
} from "../services/aiService.js";

const router = express.Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  message: { message: "AI request limit reached. Try again shortly." },
});
const idRule = param("id").isMongoId();
const providerRule = body("provider")
  .optional()
  .isIn(["openai", "anthropic", "gemini"]);

function questionPayload(qa) {
  return {
    id: qa._id,
    questionText: qa.questionText,
    questionType: qa.questionType,
    timestamp: qa.createdAt,
  };
}

async function ownedSession(id, userId) {
  return Session.findOne({ _id: id, userId });
}

router.post(
  "/",
  requireAuth,
  aiLimiter,
  [
    body("role").trim().isLength({ min: 2, max: 80 }),
    body("difficulty").isIn(["Junior", "Mid", "Senior"]),
    body("interviewType").isIn(["Technical", "Behavioral", "Mixed"]),
    body("questionCount").isInt().isIn([5, 10, 15]),
    providerRule,
    handleValidation,
  ],
  asyncHandler(async (request, response) => {
    const {
      role,
      difficulty,
      interviewType,
      questionCount,
      provider = "openai",
    } = request.body;
    const session = await Session.create({
      userId: request.user._id,
      role,
      difficulty,
      interviewType,
      questionCount,
      provider,
    });
    const question = await generateQuestion(
      role,
      difficulty,
      interviewType === "Mixed" ? "technical" : interviewType.toLowerCase(),
      [],
      provider,
    );
    const qa = await QuestionAnswer.create({
      sessionId: session._id,
      questionText: question.questionText,
      questionType: question.questionType,
    });
    response.status(201).json({ session, firstQuestion: questionPayload(qa) });
  }),
);

router.post(
  "/:id/answer",
  requireAuth,
  aiLimiter,
  [
    idRule,
    body("questionId").isMongoId(),
    body("answerText").trim().isLength({ min: 2, max: 10000 }),
    body("answerMethod").optional().isIn(["text", "voice"]),
    handleValidation,
  ],
  asyncHandler(async (request, response) => {
    const session = await ownedSession(request.params.id, request.user._id);
    if (!session)
      return response.status(404).json({ message: "Session not found" });
    const qa = await QuestionAnswer.findOne({
      _id: request.body.questionId,
      sessionId: session._id,
    });
    if (!qa)
      return response.status(404).json({ message: "Question not found" });
    qa.userAnswer = request.body.answerText;
    qa.answerMethod = request.body.answerMethod || "text";
    qa.feedback = await evaluateAnswer(
      qa.questionText,
      qa.userAnswer,
      session.role,
      session.difficulty,
      session.provider,
    );
    qa.score = qa.feedback.score;
    await qa.save();
    const answeredCount = await QuestionAnswer.countDocuments({
      sessionId: session._id,
      userAnswer: { $ne: "" },
    });
    const feedback = {
      type: "feedback",
      content: qa.feedback,
      score: qa.score,
      questionId: qa._id,
      timestamp: qa.updatedAt,
    };
    if (answeredCount >= session.questionCount)
      return response.json({ feedback, sessionComplete: true });
    const previous = await QuestionAnswer.find({
      sessionId: session._id,
    }).select("questionText");
    const next = await generateQuestion(
      session.role,
      session.difficulty,
      session.interviewType === "Mixed" ?
        answeredCount % 2 ?
          "behavioral"
        : "technical"
      : session.interviewType.toLowerCase(),
      previous.map((item) => item.questionText),
      session.provider,
    );
    const nextQa = await QuestionAnswer.create({
      sessionId: session._id,
      questionText: next.questionText,
      questionType: next.questionType,
    });
    response.json({
      feedback,
      nextQuestion: questionPayload(nextQa),
      sessionComplete: false,
    });
  }),
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (request, response) => {
    const sessions = await Session.find({ userId: request.user._id })
      .sort({ createdAt: -1 })
      .lean();
    const summaries = await SessionSummary.find({
      sessionId: { $in: sessions.map((session) => session._id) },
    }).lean();
    const summaryMap = new Map(
      summaries.map((summary) => [String(summary.sessionId), summary]),
    );
    response.json(
      sessions.map((session) => ({
        ...session,
        summary: summaryMap.get(String(session._id)) || null,
      })),
    );
  }),
);

router.get(
  "/:id",
  requireAuth,
  [idRule, handleValidation],
  asyncHandler(async (request, response) => {
    const session = await ownedSession(request.params.id, request.user._id);
    if (!session)
      return response.status(404).json({ message: "Session not found" });
    const [questions, summary] = await Promise.all([
      QuestionAnswer.find({ sessionId: session._id }).sort({ createdAt: 1 }),
      SessionSummary.findOne({ sessionId: session._id }),
    ]);
    response.json({ session, questions, summary });
  }),
);

router.post(
  "/:id/complete",
  requireAuth,
  aiLimiter,
  [idRule, handleValidation],
  asyncHandler(async (request, response) => {
    const session = await ownedSession(request.params.id, request.user._id);
    if (!session)
      return response.status(404).json({ message: "Session not found" });
    const questions = await QuestionAnswer.find({
      sessionId: session._id,
    }).sort({ createdAt: 1 });
    const summaryData = await generateSessionSummary(
      questions.map((question) => question.toObject()),
      session.provider,
    );
    const summary = await SessionSummary.findOneAndUpdate(
      { sessionId: session._id },
      { sessionId: session._id, ...summaryData },
      { upsert: true, new: true },
    );
    session.status = "completed";
    session.completedAt = new Date();
    await session.save();
    response.json({ session, summary });
  }),
);

export default router;
