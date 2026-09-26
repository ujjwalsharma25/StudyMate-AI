import express from "express";
import { callGroq } from "../utils/groq.js";
import { getStudyData, appendChatMessage } from "../utils/store.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// POST /api/chat
router.post("/", async (req, res) => {
  const { topic, message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  const topicKey = topic && topic.trim() ? topic.trim() : "General";
  const data = await getStudyData(req.userId);
  const history = (data.chat_history && data.chat_history[topicKey]) || [];

  const systemPrompt =
    `You are a patient, friendly study assistant helping a student understand ` +
    `'${topicKey}'. Explain clearly with simple examples. Keep answers focused ` +
    `and not too long. If the question is unrelated to studying, gently redirect.`;

  const convo = history
    .slice(-6)
    .map((h) => `${h.role}: ${h.text}`)
    .join("\n");
  const userPrompt = convo ? `${convo}\nstudent: ${message}` : message;

  const reply = await callGroq(systemPrompt, userPrompt);

  if (reply && reply.error) {
    return res.status(500).json({ error: reply.error });
  }

  await appendChatMessage(req.userId, topicKey, [
    { role: "student", text: message },
    { role: "assistant", text: reply },
  ]);

  res.json({ reply });
});

export default router;
