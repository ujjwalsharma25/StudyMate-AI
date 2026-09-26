import express from "express";
import { getStudyData, getQuizScores } from "../utils/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard
router.get("/", async (req, res) => {
  const data = await getStudyData(req.userId);
  const quizScores = await getQuizScores(req.userId);

  const roadmap = data.roadmap || [];
  const completedTopics = data.completed_topics || [];

  const totalTopics = roadmap.reduce((sum, day) => sum + day.topics.length, 0);
  const completedCount = completedTopics.length;

  let avgScore = 0;
  if (quizScores.length) {
    const totalPct = quizScores.reduce((sum, q) => sum + q.score / q.total, 0);
    avgScore = Math.round((totalPct / quizScores.length) * 100);
  }

  res.json({
    roadmap,
    completedTopics,
    quizScores: quizScores.map((q) => ({
      topic: q.topic,
      difficulty: q.difficulty,
      score: q.score,
      total: q.total,
      date: new Date(q.taken_at).toLocaleString(),
    })),
    totalTopics,
    completedCount,
    avgScore,
  });
});

export default router;
