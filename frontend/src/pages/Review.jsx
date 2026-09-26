import { useState, useEffect } from "react";
import api from "../api.js";

const QUALITY_BUTTONS = [
  { label: "Again", quality: 1, className: "q-again" },
  { label: "Hard", quality: 3, className: "q-hard" },
  { label: "Good", quality: 4, className: "q-good" },
  { label: "Easy", quality: 5, className: "q-easy" },
];

export default function Review() {
  const [due, setDue] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dueRes, allRes] = await Promise.all([
        api.get("/spaced-repetition/due"),
        api.get("/spaced-repetition/all"),
      ]);
      setDue(dueRes.data.due);
      setAll(allRes.data.topics);
      setCurrent(0);
    } catch {
      // non-fatal
    }
    setLoading(false);
  }

  async function submitReview(quality) {
    const topic = due[current];
    if (!topic) return;

    try {
      const res = await api.post("/spaced-repetition/review", {
        topic: topic.topic,
        quality,
      });
      setLastResult(res.data.topic);
    } catch {
      // non-fatal — still advance
    }

    if (current + 1 < due.length) {
      setCurrent(current + 1);
    } else {
      // Queue finished — reload to confirm nothing's due anymore
      loadData();
    }
  }

  if (loading) return <p className="page-desc">Loading your review queue...</p>;

  const activeTopic = due[current];

  return (
    <>
      <h1>🔁 Review Queue</h1>
      <p className="page-desc">
        Topics come back based on how well you knew them last time — this is
        the same spaced-repetition scheduling used by tools like Anki.
      </p>

      {activeTopic ? (
        <div className="review-card">
          <p className="review-progress">
            {current + 1} of {due.length} due today
          </p>
          <h2>{activeTopic.topic}</h2>
          <p className="review-meta">
            Reviewed {activeTopic.repetitions} time{activeTopic.repetitions === 1 ? "" : "s"} before
          </p>
          <p className="review-prompt">How well did you remember this topic?</p>
          <div className="review-buttons">
            {QUALITY_BUTTONS.map((b) => (
              <button
                key={b.label}
                className={`review-btn ${b.className}`}
                onClick={() => submitReview(b.quality)}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: 24 }}>
          {lastResult ? (
            <p>
              Nice — you cleared today's queue. Next review for{" "}
              <strong>{lastResult.topic}</strong> is in {lastResult.interval_days} day
              {lastResult.interval_days === 1 ? "" : "s"}.
            </p>
          ) : (
            <p>Nothing due for review right now. Topics appear here after you take a quiz on them.</p>
          )}
        </div>
      )}

      {all.length > 0 && (
        <>
          <h2 className="section-title">All tracked topics</h2>
          <table className="quiz-table">
            <tbody>
              <tr>
                <th>Topic</th>
                <th>Times reviewed</th>
                <th>Next review</th>
              </tr>
              {all.map((t, i) => (
                <tr key={i}>
                  <td>{t.topic}</td>
                  <td>{t.repetitions}</td>
                  <td>{new Date(t.next_review_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
