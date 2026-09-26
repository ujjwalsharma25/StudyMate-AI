import { useState, useEffect } from "react";
import api from "../api.js";
import Markdown from "../components/Markdown.jsx";

export default function Notes() {
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const [question, setQuestion] = useState("");
  const [selectedDoc, setSelectedDoc] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [askError, setAskError] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const res = await api.get("/rag/documents");
      setDocuments(res.data.documents);
    } catch {
      // non-fatal — page still usable
    }
  }

  async function handleUpload() {
    if (!title.trim()) {
      setUploadStatus("Please give this document a title.");
      return;
    }
    if (!file && !pastedText.trim()) {
      setUploadStatus("Upload a PDF or paste some notes.");
      return;
    }

    setUploading(true);
    setUploadStatus("Processing document — extracting text and generating embeddings...");

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", file);
        res = await api.post("/rag/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post("/rag/upload", { title, text: pastedText });
      }

      if (res.data.error) {
        setUploadStatus("Error: " + res.data.error);
      } else {
        setUploadStatus(`Done — split into ${res.data.chunkCount} searchable chunks.`);
        setTitle("");
        setPastedText("");
        setFile(null);
        loadDocuments();
      }
    } catch (err) {
      setUploadStatus("Error: " + (err.response?.data?.error || "Upload failed."));
    }
    setUploading(false);
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/rag/documents/${id}`);
      loadDocuments();
    } catch {
      // non-fatal
    }
  }

  async function handleAsk() {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    setAskError("");

    try {
      const res = await api.post("/rag/ask", {
        question,
        documentId: selectedDoc || undefined,
      });
      if (res.data.error) {
        setAskError(res.data.error);
      } else {
        setAnswer(res.data);
      }
    } catch (err) {
      setAskError(err.response?.data?.error || "Something went wrong.");
    }
    setAsking(false);
  }

  return (
    <>
      <h1>📄 Ask Your Notes</h1>
      <p className="page-desc">
        Upload a PDF or paste notes — questions here are answered only from
        what you upload, not general AI knowledge.
      </p>

      <div className="form-box">
        <label>Document title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Operating Systems — Unit 3"
        />

        <label>Upload a PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0] || null)}
        />

        <label>...or paste notes directly</label>
        <textarea
          rows={5}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste text notes here instead of a PDF"
          disabled={!!file}
        />

        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Processing..." : "Upload & Index"}
        </button>
        <p className="status">{uploadStatus}</p>
      </div>

      {documents.length > 0 && (
        <div className="form-box">
          <label>Your documents</label>
          <ul className="doc-list">
            {documents.map((d) => (
              <li key={d.id} className="doc-item">
                <span>
                  <strong>{d.title}</strong>{" "}
                  <span className="doc-meta">({d.chunk_count} chunks)</span>
                </span>
                <button className="doc-delete" onClick={() => handleDelete(d.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-box">
        <label>Ask a question</label>
        <select value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)}>
          <option value="">All documents</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What are the four conditions for deadlock?"
          style={{ marginTop: 10 }}
        />
        <button onClick={handleAsk} disabled={asking}>
          {asking ? "Searching your notes..." : "Ask"}
        </button>
        {askError && <p className="status error-text">{askError}</p>}
      </div>

      {answer && (
        <div className="rag-answer">
          <h3>Answer</h3>
          <Markdown>{answer.answer}</Markdown>
          <div className="rag-sources">
            <p className="rag-sources-label">Sourced from:</p>
            {answer.sources.map((s, i) => (
              <div key={i} className="rag-source-card">
                <span className="rag-similarity">{s.similarity}% match</span>
                <p>{s.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
