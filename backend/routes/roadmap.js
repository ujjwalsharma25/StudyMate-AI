import express from "express";
import { callGroq } from "../utils/groq.js";
import { saveRoadmap, toggleCompletedTopic } from "../utils/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// POST /api/roadmap/generate
router.post("/generate", async (req, res) => {
  const { syllabus, days } = req.body;

  if (!syllabus || !syllabus.trim()) {
    return res.status(400).json({ error: "Please paste your syllabus or topic list." });
  }

  const systemPrompt =
    "You are an expert study planner. Given a syllabus and number of days, " +
    "break it into a day-wise study plan. Respond ONLY with valid JSON in this " +
    'exact shape, no markdown fences, no extra text:\n' +
    '{"plan": [{"day": 1, "topics": ["topic1", "topic2"], ' +
    '"focus": "short one-line goal for the day"}]}';

  const userPrompt = `Syllabus:\n${syllabus}\n\nDays available: ${days || 7}`;

  const result = await callGroq(systemPrompt, userPrompt, true);

  if (result && result.error) {
    return res.status(500).json({ error: result.error });
  }

  let parsed;
  try {
    parsed = JSON.parse(result);
  } catch {
    return res.status(500).json({ error: "AI response could not be parsed. Try again." });
  }

  // Give each topic a unique id so the frontend can track completion
  let counter = 0;
  parsed.plan.forEach((day) => {
    day.topics = day.topics.map((t) => ({ id: `t${counter++}`, text: t }));
  });

  await saveRoadmap(req.userId, parsed.plan);

  res.json(parsed);
});

// POST /api/roadmap/toggle-complete  { topicId }
router.post("/toggle-complete", async (req, res) => {
  const { topicId } = req.body;
  const completedTopics = await toggleCompletedTopic(req.userId, topicId);
  res.json({ completedTopics });
});

export default router;
