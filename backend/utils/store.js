import { pool } from "../db.js";

export async function getStudyData(userId) {
  const result = await pool.query(
    "SELECT roadmap, completed_topics, chat_history FROM study_data WHERE user_id = $1",
    [userId]
  );
  if (result.rows.length === 0) {
    // Safety net — should already exist from signup, but just in case.
    await pool.query("INSERT INTO study_data (user_id) VALUES ($1)", [userId]);
    return { roadmap: [], completed_topics: [], chat_history: {} };
  }
  return result.rows[0];
}

export async function saveRoadmap(userId, roadmap) {
  await pool.query(
    `UPDATE study_data SET roadmap = $1, completed_topics = '[]', updated_at = NOW()
     WHERE user_id = $2`,
    [JSON.stringify(roadmap), userId]
  );
}

export async function toggleCompletedTopic(userId, topicId) {
  const data = await getStudyData(userId);
  const completed = new Set(data.completed_topics);
  if (completed.has(topicId)) completed.delete(topicId);
  else completed.add(topicId);

  const updated = Array.from(completed);
  await pool.query(
    "UPDATE study_data SET completed_topics = $1, updated_at = NOW() WHERE user_id = $2",
    [JSON.stringify(updated), userId]
  );
  return updated;
}

export async function appendChatMessage(userId, topicKey, entries) {
  const data = await getStudyData(userId);
  const history = data.chat_history || {};
  const existing = history[topicKey] || [];
  history[topicKey] = [...existing, ...entries];

  await pool.query(
    "UPDATE study_data SET chat_history = $1, updated_at = NOW() WHERE user_id = $2",
    [JSON.stringify(history), userId]
  );
  return history[topicKey];
}

export async function saveQuizScore(userId, { topic, difficulty, score, total }) {
  await pool.query(
    `INSERT INTO quiz_scores (user_id, topic, difficulty, score, total)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, topic, difficulty || "medium", score, total]
  );
}

export async function getQuizScores(userId) {
  const result = await pool.query(
    "SELECT topic, difficulty, score, total, taken_at FROM quiz_scores WHERE user_id = $1 ORDER BY taken_at DESC",
    [userId]
  );
  return result.rows;
}
