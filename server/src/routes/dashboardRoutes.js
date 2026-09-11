import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Session from "../schema/Session.js";
import QuestionAnswer from "../schema/QuestionAnswer.js";

const router = express.Router();
router.get("/stats", requireAuth, async (request, response) => {
  const sessions = await Session.find({ userId: request.user._id })
    .sort({ createdAt: 1 })
    .lean();
  const ids = sessions.map((session) => session._id);
  const answers = await QuestionAnswer.find({
    sessionId: { $in: ids },
    score: { $ne: null },
  }).lean();
  const bySession = new Map();
  answers.forEach((answer) => {
    const key = String(answer.sessionId);
    bySession.set(key, [...(bySession.get(key) || []), answer.score]);
  });
  const scoreTrend = sessions.map((session) => {
    const scores = bySession.get(String(session._id)) || [];
    return {
      date: session.createdAt,
      score:
        scores.length ?
          Math.round(
            (scores.reduce((sum, score) => sum + score, 0) / scores.length) *
              10,
          ) / 10
        : 0,
      role: session.role,
    };
  });
  const completed = scoreTrend.filter((item) => item.score > 0);
  response.json({
    totalSessions: sessions.length,
    completedSessions: sessions.filter(
      (session) => session.status === "completed",
    ).length,
    averageScore:
      completed.length ?
        Math.round(
          (completed.reduce((sum, item) => sum + item.score, 0) /
            completed.length) *
            10,
        ) / 10
      : 0,
    scoreTrend,
    roleBreakdown: [...new Set(sessions.map((session) => session.role))].map(
      (role) => ({
        role,
        count: sessions.filter((session) => session.role === role).length,
      }),
    ),
  });
});
export default router;
