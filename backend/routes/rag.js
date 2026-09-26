import express from "express";
import multer from "multer";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { chunkText } from "../utils/chunker.js";
import { embedBatch, embedText, toPgVector } from "../utils/embeddings.js";
import { callGroq } from "../utils/groq.js";

const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// POST /api/rag/upload
// Accepts either a PDF file (multipart field "file") or pasted text
// (JSON field "text"), plus a "title". Extracts text, splits it into
// overlapping chunks, embeds each chunk, and stores everything.
router.post("/upload", upload.single("file"), async (req, res) => {
  const { title } = req.body;
  let rawText = req.body.text || "";

  if (req.file) {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: req.file.buffer });
      const result = await parser.getText();
      rawText = result.text;
    } catch (err) {
      return res.status(400).json({ error: "Could not read that PDF. Try a text-based PDF, not a scanned image." });
    }
  }

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: "No text found. Upload a PDF or paste some notes." });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Please give this document a title." });
  }

  const chunks = chunkText(rawText, { chunkSize: 220, overlap: 40 });
  if (chunks.length === 0) {
    return res.status(400).json({ error: "Document appears to be empty after processing." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const docResult = await client.query(
      "INSERT INTO documents (user_id, title) VALUES ($1, $2) RETURNING id",
      [req.userId, title.trim()]
    );
    const documentId = docResult.rows[0].id;

    // Embed all chunks (local model — no API cost), then insert each.
    const embeddings = await embedBatch(chunks);

    for (let i = 0; i < chunks.length; i++) {
      await client.query(
        `INSERT INTO document_chunks (document_id, user_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [documentId, req.userId, i, chunks[i], toPgVector(embeddings[i])]
      );
    }

    await client.query("COMMIT");
    res.json({ documentId, title: title.trim(), chunkCount: chunks.length });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to process document. Please try again." });
  } finally {
    client.release();
  }
});

// GET /api/rag/documents — list this user's uploaded documents
router.get("/documents", async (req, res) => {
  const result = await pool.query(
    `SELECT d.id, d.title, d.uploaded_at, COUNT(c.id) AS chunk_count
     FROM documents d
     LEFT JOIN document_chunks c ON c.document_id = d.id
     WHERE d.user_id = $1
     GROUP BY d.id
     ORDER BY d.uploaded_at DESC`,
    [req.userId]
  );
  res.json({ documents: result.rows });
});

// DELETE /api/rag/documents/:id
router.delete("/documents/:id", async (req, res) => {
  await pool.query("DELETE FROM documents WHERE id = $1 AND user_id = $2", [
    req.params.id,
    req.userId,
  ]);
  res.json({ status: "deleted" });
});

// POST /api/rag/ask
// The actual RAG step: embed the question, pull the most similar chunks
// from THIS user's documents via pgvector cosine search, then ask Groq
// to answer using only that retrieved context.
router.post("/ask", async (req, res) => {
  const { question, documentId } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: "Please ask a question." });
  }

  const questionEmbedding = await embedText(question);
  const vectorParam = toPgVector(questionEmbedding);

  const params = [vectorParam, req.userId];
  let documentFilter = "";
  if (documentId) {
    documentFilter = "AND document_id = $3";
    params.push(documentId);
  }

  // <=> is pgvector's cosine-distance operator — smaller is more similar.
  const result = await pool.query(
    `SELECT content, 1 - (embedding <=> $1) AS similarity
     FROM document_chunks
     WHERE user_id = $2 ${documentFilter}
     ORDER BY embedding <=> $1
     LIMIT 4`,
    params
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: "No notes uploaded yet. Upload a document first." });
  }

  const context = result.rows.map((r, i) => `[Excerpt ${i + 1}]\n${r.content}`).join("\n\n");

  const systemPrompt =
    "You are a study assistant. Answer the student's question using ONLY the " +
    "excerpts from their own notes provided below. If the excerpts don't contain " +
    "the answer, say so honestly instead of guessing — do not use outside knowledge. " +
    "Keep the answer clear and concise.";

  const userPrompt = `Notes excerpts:\n${context}\n\nQuestion: ${question}`;

  const answer = await callGroq(systemPrompt, userPrompt);

  if (answer && answer.error) {
    return res.status(500).json({ error: answer.error });
  }

  res.json({
    answer,
    sources: result.rows.map((r) => ({
      excerpt: r.content.slice(0, 150) + (r.content.length > 150 ? "..." : ""),
      similarity: Math.round(r.similarity * 100),
    })),
  });
});

export default router;
