import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="hero">
      <h1>Your syllabus. Your pace. One AI companion.</h1>
      <p className="subtitle">
        Upload your syllabus, get a day-wise plan, test yourself with
        auto-generated quizzes, and clear doubts instantly — all tracked on
        one dashboard.
      </p>

      <div className="hero-stack">
        <div className="stack-card">
          Roadmap ready
          <small>12 topics, 7 days</small>
        </div>
        <div className="stack-card">
          Quiz scored
          <small>4 / 5 correct</small>
        </div>
        <div className="stack-card">
          Notes indexed
          <small>92% match found</small>
        </div>
      </div>

      <div className="hero-cards">
        <Link to="/roadmap" className="card">
          <h3>🗺️ Study Roadmap</h3>
          <p>Paste your syllabus, set your deadline, get a day-by-day plan. Mark topics done as you go.</p>
        </Link>
        <Link to="/quiz" className="card">
          <h3>📝 Auto Quiz</h3>
          <p>Enter any topic, pick a difficulty, get an instant 5-question test.</p>
        </Link>
        <Link to="/chat" className="card">
          <h3>💬 Doubt Chat</h3>
          <p>Stuck on a concept? Ask and get a clear, simple explanation.</p>
        </Link>
        <Link to="/dashboard" className="card">
          <h3>📊 Dashboard</h3>
          <p>Track roadmap completion %, quiz history, and performance.</p>
        </Link>
      </div>
    </section>
  );
}
