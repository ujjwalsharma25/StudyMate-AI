import { useState } from "react";
import api from "../api.js";

export default function Roadmap() {
  const [syllabus, setSyllabus] = useState("");
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateRoadmap() {
    if (!syllabus.trim()) {
      setStatus("Please paste your syllabus first.");
      return;
    }
    setLoading(true);
    setStatus("Generating your plan...");
    try {
      const res = await api.post("/roadmap/generate", { syllabus, days });
      if (res.data.error) {
        setStatus("Error: " + res.data.error);
      } else {
        setPlan(res.data.plan);
        setCompleted(new Set());
        setStatus("");
      }
    } catch (err) {
      setStatus("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  // NEW FEATURE: toggle a topic's completion, synced with backend + dashboard
  async function toggleTopic(topicId) {
    const next = new Set(completed);
    if (next.has(topicId)) next.delete(topicId);
    else next.add(topicId);
    setCompleted(next);

    try {
      await api.post("/roadmap/toggle-complete", { topicId });
    } catch {
      // non-fatal — UI stays in sync locally either way
    }
  }

  return (
    <>
      <h1>🗺️ Generate Your Study Roadmap</h1>
      <p className="page-desc">
        Paste your syllabus or topic list, tell us how many days you have,
        and we'll split it into a day-wise plan. Mark topics as you complete them.
      </p>

      <div className="form-box">
        <label>Syllabus / Topics</label>
        <textarea
          rows={6}
          value={syllabus}
          onChange={(e) => setSyllabus(e.target.value)}
          placeholder={"e.g. Unit 1: Data Structures - Arrays, Linked Lists, Stacks, Queues\nUnit 2: Trees - BST, AVL, Heaps"}
        />

        <label>Days available</label>
        <input
          type="number"
          min={1}
          max={60}
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />

        <button onClick={generateRoadmap} disabled={loading}>
          {loading ? "Generating..." : "Generate Roadmap"}
        </button>
        <p className="status">{status}</p>
      </div>

      <div className="roadmap-result">
        {plan.map((day) => (
          <div className="day-card" key={day.day}>
            <h3>Day {day.day}</h3>
            <p className="focus">{day.focus}</p>
            <ul className="topic-checklist">
              {day.topics.map((topic) => (
                <li key={topic.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={completed.has(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                    />
                    <span className={completed.has(topic.id) ? "done" : ""}>
                      {topic.text}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
