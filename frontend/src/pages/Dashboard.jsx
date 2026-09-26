import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page-desc">Loading your progress...</p>;
  if (!data) return <p className="page-desc">Could not load dashboard.</p>;

  // NEW FEATURE: completion percentage across the whole roadmap
  const completionPct =
    data.totalTopics > 0
      ? Math.round((data.completedCount / data.totalTopics) * 100)
      : 0;

  return (
    <>
      <h1>📊 Your Progress</h1>

      <div className="stats-row">
        <div className="stat-card">
          <h2>{data.totalTopics}</h2>
          <p>Topics in Roadmap</p>
        </div>
        <div className="stat-card">
          <h2>{completionPct}%</h2>
          <p>Roadmap Completed</p>
        </div>
        <div className="stat-card">
          <h2>{data.quizScores.length}</h2>
          <p>Quizzes Taken</p>
        </div>
        <div className="stat-card">
          <h2>{data.avgScore}%</h2>
          <p>Average Quiz Score</p>
        </div>
      </div>

      <h2 className="section-title">Study Roadmap</h2>
      {data.roadmap.length > 0 ? (
        <div className="roadmap-result">
          {data.roadmap.map((day) => (
            <div className="day-card" key={day.day}>
              <h3>Day {day.day}</h3>
              <p className="focus">{day.focus}</p>
              <ul className="topic-checklist">
                {day.topics.map((topic) => (
                  <li key={topic.id}>
                    <span className={data.completedTopics.includes(topic.id) ? "done" : ""}>
                      {data.completedTopics.includes(topic.id) ? "✅ " : "⬜ "}
                      {topic.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          No roadmap yet. <Link to="/roadmap">Generate one →</Link>
        </p>
      )}

      <h2 className="section-title">Quiz History</h2>
      {data.quizScores.length > 0 ? (
        <table className="quiz-table">
          <tbody>
            <tr>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
            {data.quizScores.map((q, i) => (
              <tr key={i}>
                <td>{q.topic}</td>
                <td>{q.difficulty}</td>
                <td>{q.score} / {q.total}</td>
                <td>{q.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-state">
          No quizzes taken yet. <Link to="/quiz">Take one →</Link>
        </p>
      )}
    </>
  );
}
