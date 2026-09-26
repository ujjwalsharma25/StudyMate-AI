import { useState, useRef, useEffect } from "react";
import api from "../api.js";
import Markdown from "../components/Markdown.jsx";

export default function Chat() {
  const [topic, setTopic] = useState("General");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage() {
    const text = message.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "student", text }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/chat", { topic: topic || "General", message: text });
      if (res.data.error) {
        setMessages((prev) => [...prev, { role: "error", text: res.data.error }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "error", text: "Something went wrong." }]);
    }
    setLoading(false);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") sendMessage();
  }

  return (
    <>
      <h1>💬 Ask Your Doubt</h1>
      <p className="page-desc">
        Set a topic, then chat naturally — the AI keeps context within that topic.
      </p>

      <div className="form-box">
        <label>Topic (helps the AI stay focused)</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Operating Systems - Deadlocks"
        />
      </div>

      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === "assistant" ? <Markdown>{m.text}</Markdown> : m.text}
          </div>
        ))}
        {loading && <div className="msg assistant loading">Thinking...</div>}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </>
  );
}
