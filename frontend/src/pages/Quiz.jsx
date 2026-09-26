import { useState } from "react";
import api from "../api.js";

export default function Quiz() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateQuiz() {
    if (!topic.trim()) {
      setStatus("Please enter a topic.");
      return;
    }
    setLoading(true);
    setStatus("Generating quiz...");
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setScore(null);

    try {
      const res = await api.post("/quiz/generate", { topic, notes, difficulty });
      if (res.data.error) {
        setStatus("Error: " + res.data.error);
      } else {
        setQuestions(res.data.questions);
        setStatus("");
      }
    } catch (err) {
      setStatus("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  function selectAnswer(qIndex, optIndex) {
    if (submitted) return;
    setAnswers({ ...answers, [qIndex]: optIndex });
  }

  async function submitQuiz() {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) correct++;
    });
    setScore(correct);
    setSubmitted(true);

    try {
      await api.post("/quiz/save-score", {
        topic,
        score: correct,
        total: questions.length,
        difficulty,
      });
    } catch {
      // non-fatal
    }
  }

  return (
    <>
      <h1>📝 Test Yourself</h1>
      <p className="page-desc">
        Enter a topic, pick a difficulty, and get an instant 5-question quiz.
      </p>

      <div className="form-box">
        <label>Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Binary Search Trees"
        />

        <label>Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="difficulty-select"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <label>Extra notes (optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste specific notes if you want the quiz based on them"
        />

        <button onClick={generateQuiz} disabled={loading}>
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
        <p className="status">{status}</p>
      </div>

      <div className="quiz-result">
        {questions.map((q, i) => {
          const selected = answers[i];
          const isCorrect = submitted && selected === q.correct_index;
          const isWrong = submitted && selected !== undefined && selected !== q.correct_index;
          return (
            <div
              key={i}
              className={`quiz-card ${isCorrect ? "correct" : ""} ${isWrong ? "incorrect" : ""}`}
            >
              <p className="q-text">{i + 1}. {q.question}</p>
              {q.options.map((opt, j) => (
                <label className="option" key={j}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={selected === j}
                    onChange={() => selectAnswer(i, j)}
                  />
                  {opt}
                </label>
              ))}
              {submitted && (
                <p className="explanation">
                  ✔ {q.options[q.correct_index]} — {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {questions.length > 0 && !submitted && (
        <button className="submit-btn" onClick={submitQuiz}>
          Submit Quiz
        </button>
      )}

      {submitted && (
        <div className="score-result">
          <h3>You scored {score} / {questions.length}</h3>
        </div>
      )}
    </>
  );
}
