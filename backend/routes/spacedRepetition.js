import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { sm2 } from "../utils/sm2.js";

const router = express.Router();
router.use(requireAuth);

// GET /api/spaced-repetition/due
// Topics whose next_review_date has arrived (or passed).
router.get("/due", async (req, res) => {
  const result = await pool.query(
    `SELECT topic, ease_factor, interval_days, repetitions, next_review_date, last_reviewed_at
     FROM topic_mastery
     WHERE user_id = $1 AND next_review_date <= CURRENT_DATE
     ORDER BY next_review_date ASC`,
    [req.userId]
  );
  res.json({ due: result.rows });
});

// GET /api/spaced-repetition/all
// Every topic the student has ever been quizzed on, due or not — used to
// show a full mastery overview.
router.get("/all", async (req, res) => {
  const result = await pool.query(
    `SELECT topic, ease_factor, interval_days, repetitions, next_review_date, last_reviewed_at
     FROM topic_mastery
     WHERE user_id = $1
     ORDER BY next_review_date ASC`,
    [req.userId]
  );
  res.json({ topics: result.rows });
});

// POST /api/spaced-repetition/review
// Body: { topic, quality } — quality is 0-5 (see utils/sm2.js).
// Call this after a quiz attempt: e.g. quality = round((score/total) * 5).
router.post("/review", async (req, res) => {
  try {
    const { topic, quality } = req.body;

    if (!topic || quality === undefined) {
      return res.status(400).json({ error: "topic and quality are required." });
    }

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

    const next = sm2(Number(quality), prevState);

    const result = await pool.query(
      `INSERT INTO topic_mastery (user_id, topic, ease_factor, interval_days, repetitions, next_review_date, last_reviewed_at)
       VALUES ($1, $2, $3, $4::int, $5, CURRENT_DATE + ($4::int * INTERVAL '1 day'), NOW())
       ON CONFLICT (user_id, topic) DO UPDATE SET
         ease_factor = $3, interval_days = $4::int, repetitions = $5,
         next_review_date = CURRENT_DATE + ($4::int * INTERVAL '1 day'),
         last_reviewed_at = NOW()
       RETURNING topic, ease_factor, interval_days, repetitions, next_review_date`,
      [req.userId, topic, next.easeFactor, next.interval, next.repetitions]
    );

    res.json({ topic: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save review. Please try again." });
  }
});

export default router;
