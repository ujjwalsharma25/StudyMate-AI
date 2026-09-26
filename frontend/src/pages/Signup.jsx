import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password) {
      setError("Name, email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", {
        fullName,
        email,
        password,
        educationLevel,
        goal,
      });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <h1>Create your account</h1>
      <p className="page-desc">
        A few one-time details help us set up your study space.
      </p>

      <form className="form-box" onSubmit={handleSubmit}>
        <label>Full name</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />

        <label>Education level</label>
        <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
          <option value="">Select one</option>
          <option value="School (up to 10th)">School (up to 10th)</option>
          <option value="Class 11-12">Class 11-12</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Postgraduate">Postgraduate</option>
          <option value="Other">Other</option>
        </select>

        <label>What are you preparing for?</label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Semester exams, JEE, placement prep"
        />

        {error && <p className="status error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
