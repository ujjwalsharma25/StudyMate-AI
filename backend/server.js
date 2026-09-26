import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import roadmapRoutes from "./routes/roadmap.js";
import quizRoutes from "./routes/quiz.js";
import chatRoutes from "./routes/chat.js";
import dashboardRoutes from "./routes/dashboard.js";
import ragRoutes from "./routes/rag.js";
import spacedRepetitionRoutes from "./routes/spacedRepetition.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/spaced-repetition", spacedRepetitionRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "StudyMate AI backend is running" });
});

// Global safety net: any error a route forgot to catch lands here as JSON
// instead of crashing the whole process.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`StudyMate AI backend running on http://localhost:${PORT}`);
});
