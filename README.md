<div align="center">

<img src="./docs/hero-screenshot.png" alt="StudyMate AI landing page" width="100%" />

# 🧠 StudyMate AI

### Your syllabus. Your pace. One AI companion.

**Upload a syllabus → get a day-wise roadmap. Take AI-generated quizzes. Ask questions about your own notes with RAG. Never forget a topic again with spaced repetition.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Groq](https://img.shields.io/badge/LLM-Groq-F55036?style=flat-square)](https://groq.com)
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)]()

</div>

---

## 📖 Overview

StudyMate AI is a full-stack, AI-powered study companion built for **DEV2HACK 2026**. It turns a raw syllabus into a personalized, trackable study plan — and backs it up with a real RAG (Retrieval-Augmented Generation) pipeline, an adaptive spaced-repetition engine, and a live progress dashboard, all sitting behind proper authentication.

It isn't a thin wrapper around a chat API — every core feature is backed by a real algorithm or data pipeline:

| Feature | What's actually happening under the hood |
|---|---|
| 🗺️ **Roadmap Generator** | Syllabus text → structured day-wise JSON plan via LLM prompting, stored + tracked per user |
| 📝 **Quiz Generator** | Topic + difficulty → 5 AI-written MCQs with explanations, scored and logged |
| 💬 **Doubt Chatbot** | Topic-scoped conversational context, not a stateless one-shot call |
| 📄 **Ask Your Notes (RAG)** | PDF → chunked → embedded locally (no API cost) → stored as vectors in **pgvector** → cosine-similarity search → only matched chunks are sent to the LLM |
| 🔁 **Spaced Repetition** | Every quiz result feeds the **SM-2 algorithm** (the same scheduling logic behind Anki) to decide exactly when a topic should resurface |
| 📊 **Dashboard** | Live roadmap completion %, quiz history, and average score, computed from real relational data |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    U["👤 Student"] -->|"Signup / Login<br/>(JWT + bcrypt)"| FE["⚛️ React Frontend<br/>(Vite, :5173)"]

    FE -->|"REST API calls<br/>Authorization: Bearer token"| BE["🚀 Express Backend<br/>(:5000)"]

    subgraph BE_ROUTES [" "]
        direction TB
        R1["Roadmap Route"]
        R2["Quiz Route"]
        R3["Chat Route"]
        R4["RAG / Notes Route"]
        R5["Spaced Repetition Route"]
        R6["Dashboard Route"]
    end

    BE --> BE_ROUTES

    R1 -->|"prompt"| GROQ["🧠 Groq LLM API<br/>(gpt-oss-120b)"]
    R2 -->|"prompt"| GROQ
    R3 -->|"prompt"| GROQ

    R4 -->|"1. chunk document"| CHUNK["utils/chunker.js"]
    CHUNK -->|"2. embed locally"| EMB["utils/embeddings.js<br/>(Xenova/all-MiniLM-L6-v2)"]
    EMB -->|"3. store vectors"| PG[("🐘 PostgreSQL + pgvector")]
    R4 -->|"4. similarity search<br/>ORDER BY embedding <=> query"| PG
    R4 -->|"5. relevant chunks only"| GROQ

    R5 -->|"quiz result → quality score"| SM2["utils/sm2.js<br/>(SM-2 algorithm)"]
    SM2 -->|"update ease factor,<br/>interval, next review"| PG

    R6 -->|"aggregate queries"| PG
    R1 -->|"store plan"| PG
    R2 -->|"store attempt"| PG

    GROQ -->|"AI response"| BE
    PG -->|"data"| BE
    BE -->|"JSON"| FE
    FE -->|"rendered UI"| U

    style U fill:#4f46e5,color:#fff
    style FE fill:#61dafb,color:#000
    style BE fill:#339933,color:#fff
    style GROQ fill:#f55036,color:#fff
    style PG fill:#4169e1,color:#fff
    style SM2 fill:#fbbf24,color:#000
    style EMB fill:#a78bfa,color:#000
```

### RAG pipeline in detail

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Embedder as Local Embedder<br/>(Xenova/all-MiniLM-L6-v2)
    participant DB as PostgreSQL + pgvector
    participant Groq as Groq LLM

    User->>Frontend: Upload PDF / paste notes
    Frontend->>Backend: POST /api/rag/upload
    Backend->>Backend: Split into ~220-word overlapping chunks
    loop for each chunk
        Backend->>Embedder: embed(chunk)
        Embedder-->>Backend: vector (local, free, offline after first run)
        Backend->>DB: INSERT chunk + embedding
    end

    User->>Frontend: Ask a question
    Frontend->>Backend: POST /api/rag/ask
    Backend->>Embedder: embed(question)
    Embedder-->>Backend: query vector
    Backend->>DB: SELECT ... ORDER BY embedding <=> query_vector LIMIT k
    DB-->>Backend: top-k relevant chunks
    Backend->>Groq: "Answer only using these chunks: ..."
    Groq-->>Backend: grounded answer
    Backend-->>Frontend: answer + source chunks
    Frontend-->>User: displayed answer
```

---

## ✨ Features

- 🔐 **Signup / Login** — bcrypt-hashed passwords, JWT sessions, one-time profile (education level, study goal) collected at signup
- 🗺️ **Roadmap Generator** — paste a syllabus, get a day-wise plan, check off topics as you finish them
- 📝 **Quiz Generator** — pick a topic + difficulty (easy/medium/hard), get 5 AI-written MCQs with explanations
- 💬 **Doubt Chatbot** — topic-scoped chat that remembers recent context
- 📄 **Ask Your Notes (RAG)** — upload a PDF or paste notes; questions are answered *only* from that material using retrieval-augmented generation, not general AI knowledge
- 🔁 **Spaced Repetition Review** — every quiz result feeds the SM-2 algorithm; a Review queue resurfaces topics right when you're about to forget them
- 📊 **Dashboard** — roadmap completion %, quiz history, average score

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| Backend | Node.js, Express |
| Database | PostgreSQL + `pgvector` |
| Auth | JWT, bcryptjs |
| LLM | Groq API (`openai/gpt-oss-120b`) |
| Embeddings | `@xenova/transformers` — local, offline, free |
| Spaced Repetition | Custom SM-2 implementation |

---

## 📁 Project Structure

```
StudyMateAI-MERN/
├── backend/                  Express API (Node.js)
│   ├── server.js
│   ├── db.js                 PostgreSQL connection pool
│   ├── schema.sql            table definitions — run this first (needs pgvector)
│   ├── middleware/auth.js    JWT verification
│   ├── routes/                auth.js, roadmap.js, quiz.js, chat.js,
│   │                           dashboard.js, rag.js, spacedRepetition.js
│   └── utils/                 groq.js (AI calls), store.js (Postgres queries),
│                               embeddings.js (local vector embeddings),
│                               chunker.js (splits documents for RAG),
│                               sm2.js (spaced-repetition scheduling)
└── frontend/                 React app (Vite)
    └── src/
        ├── context/AuthContext.jsx
        ├── pages/             Home, Login, Signup, Roadmap, Quiz, Chat,
        │                       Notes, Review, Dashboard
        └── components/        Navbar, ProtectedRoute
```

---

## 🚀 Getting Started

### 1. Database (PostgreSQL + pgvector)

RAG needs the `pgvector` extension for similarity search.

```bash
# Ubuntu/Debian — match the package to your installed PostgreSQL version
sudo apt install postgresql-16-pgvector

createdb studymate
psql -d studymate -f backend/schema.sql
```

`schema.sql` enables the extension itself (`CREATE EXTENSION IF NOT EXISTS vector;`), so just make sure the extension package above is installed first.

This creates: `users`, `study_data`, `quiz_scores`, `documents`, `document_chunks` (RAG), and `topic_mastery` (spaced repetition).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in:
#   GROQ_API_KEY   — from console.groq.com/keys
#   DATABASE_URL   — your Postgres connection string
#   JWT_SECRET     — any long random string
npm run dev
```

Runs on **http://localhost:5000**.

> **First-run note:** the Notes feature downloads a small embedding model (~90MB, `Xenova/all-MiniLM-L6-v2`) the first time you upload a document or ask a question. Needs internet once — after that it's cached and works fully offline, with no per-request cost.

### 3. Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173** and proxies `/api` calls to the backend.

Open **http://localhost:5173**, sign up, and you're in.

---

## 🔍 How It Works (Judge / Interview Q&A)

- **Auth** — signup hashes the password with bcrypt and stores it in `users`; login checks the hash and returns a JWT. The frontend keeps the JWT in `localStorage` and sends it as `Authorization: Bearer <token>` on every request. `middleware/auth.js` verifies it and attaches `req.userId`, which every protected route uses to scope data to that user.
- **Storage** — PostgreSQL. Roadmap and chat history live as JSONB on `study_data` since their shape is naturally nested; quiz attempts are a proper relational table (one row per attempt).
- **AI calls** — every AI route (`roadmap/generate`, `quiz/generate`, `chat`) goes through `utils/groq.js`, which sends a system + user prompt to Groq and asks for structured JSON back.
- **RAG (Ask Your Notes)** — an uploaded PDF/text is split into overlapping ~220-word chunks (`utils/chunker.js`), each chunk is embedded locally (`utils/embeddings.js`, no API cost), and stored in `document_chunks.embedding`, a pgvector column. A question is embedded the same way, then Postgres runs a cosine-similarity search (`ORDER BY embedding <=> query_vector`) to find the most relevant chunks — which are the *only* context handed to the LLM. That retrieval step is what makes it RAG rather than a generic chatbot.
- **Spaced repetition** — `utils/sm2.js` implements the SM-2 algorithm. Every quiz result auto-converts to a 0–5 "quality" score and updates that topic's ease factor, interval, and next review date in `topic_mastery`. The Review page pulls whatever is due today and lets the student rate recall (Again/Hard/Good/Easy), rescheduling the topic again.

---

## 📝 Notes

- Make sure PostgreSQL (with pgvector) is running, the schema is applied, and both backend (`:5000`) and frontend (`:5173`) are running together.
- The app works without a Groq key too — AI features show a clear error until one is added; auth, dashboard, and the review queue work regardless.
- The RAG embedding model needs internet on first use only — after that it's fully local and free.

---

<div align="center">

### Built for DEV2HACK 2026 by Team Vision Coders

**Ujjwal Sharma** (Team Lead) · Aastha · Aanya · Nishita

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ujjwal_Sharma-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/your-linkedin-handle)
[![GitHub](https://img.shields.io/badge/GitHub-your--username-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/your-username)

*⭐ If this project helped you, consider giving it a star!*

</div>
