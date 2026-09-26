import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        📘 StudyMate <span>AI</span>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/roadmap">Roadmap</Link>
            <Link to="/quiz">Quiz</Link>
            <Link to="/chat">Doubt Chat</Link>
            <Link to="/notes">Notes</Link>
            <Link to="/review">Review</Link>
            <Link to="/dashboard">Dashboard</Link>
            <span className="nav-user">Hi, {user.fullName.split(" ")[0]}</span>
            <button className="logout-btn" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="nav-cta">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
