import express from "express";
import { callGroq } from "../utils/groq.js";
import { saveQuizScore } from "../utils/store.js";
import { sm2 } from "../utils/sm2.js";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// POST /api/quiz/generate
router.post("/generate", async (req, res) => {
  const { topic, notes, difficulty } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Please enter a topic." });
  }

  const level = difficulty || "medium";

  const systemPrompt =
    "You are a quiz generator for students. Create exactly 5 multiple-choice " +
    `questions on the given topic at a ${level} difficulty level. ` +
    "Each question has 4 options, 1 correct answer, and a one-line explanation. " +
    'Respond ONLY with valid JSON, no markdown fences:\n' +
    '{"questions": [{"question": "...", "options": ["a","b","c","d"], ' +
    '"correct_index": 0, "explanation": "..."}]}';

  const userPrompt = `Topic: ${topic}\n\nAdditional notes (optional): ${notes || ""}`;

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

  res.json(parsed);
});

// POST /api/quiz/save-score
router.post("/save-score", async (req, res) => {
  try {
    const { topic, score, total, difficulty } = req.body;
    await saveQuizScore(req.userId, { topic, difficulty, score, total });

    // Feed this result into spaced repetition: score/total (0-1) maps to a
    // 0-5 quality score that sm2() expects.
    const quality = total > 0 ? Math.round((score / total) * 5) : 3;

    const existing = await pool.query(
      "SELECT ease_factor, interval_days, repetitions FROM topic_mastery WHERE user_id = $1 AND topic = $2",
      [req.userId, topic]
    );
    const prevState = existing.rows[0]
      ? {
          easeFactor: existing.rows[0].ease_factor,
          interval: existing.rows[0].interval_days,
          repetitions: existing.rows[0].repetitions,
        }
      : { easeFactor: 2.5, interval: 0, repetitions: 0 };

    const next = sm2(quality, prevState);

    await pool.query(
      `INSERT INTO topic_mastery (user_id, topic, ease_factor, interval_days, repetitions, next_review_date, last_reviewed_at)
       VALUES ($1, $2, $3, $4::int, $5, CURRENT_DATE + ($4::int * INTERVAL '1 day'), NOW())
       ON CONFLICT (user_id, topic) DO UPDATE SET
         ease_factor = $3, interval_days = $4::int, repetitions = $5,
         next_review_date = CURRENT_DATE + ($4::int * INTERVAL '1 day'),
         last_reviewed_at = NOW()`,
      [req.userId, topic, next.easeFactor, next.interval, next.repetitions]
    );

    res.json({ status: "saved", nextReview: next });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save quiz score. Please try again." });
  }
});

export default router;
