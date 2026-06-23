import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API = "http://127.0.0.1:8000";

const WELCOME = {
  role: "assistant",
  content: "Hello! I'm MemoryMesh — your privacy-aware AI assistant. Ask me anything. Your session is AES-256 encrypted and all embeddings are wiped the moment I answer.",
};

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 10,
      alignItems: "flex-start",
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32,
        borderRadius: "50%",
        background: isUser ? "var(--teal-dim)" : "var(--accent-dim)",
        color: isUser ? "var(--teal)" : "#a0b4ff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600, flexShrink: 0,
      }}>
        {isUser ? "U" : "M"}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "78%" }}>
        <div style={{
          fontSize: 11,
          color: "var(--text-faint)",
          fontFamily: "var(--mono)",
          marginBottom: 4,
          textAlign: isUser ? "right" : "left",
        }}>
          {isUser ? "You" : "MemoryMesh"}
        </div>
        <div style={{
          padding: "10px 14px",
          borderRadius: "var(--radius)",
          fontSize: 13,
          lineHeight: 1.65,
          background: isUser ? "var(--accent-dim)" : "var(--bg-card)",
          border: isUser
            ? "1px solid rgba(99,120,255,0.22)"
            : "1px solid var(--border)",
          color: isUser ? "#c5cfff" : "var(--text)",
        }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{
        width: 32, height: 32,
        borderRadius: "50%",
        background: "var(--accent-dim)",
        color: "#a0b4ff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600,
      }}>M</div>
      <div style={{
        display: "flex", gap: 5, alignItems: "center",
        padding: "12px 16px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <span key={i} style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: "var(--text-dim)",
            display: "inline-block",
            animation: `bounce 1.2s ${delay}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

function Query() {
  const [messages,  setMessages]  = useState([WELCOME]);
  const [question,  setQuestion]  = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = async () => {
    const q = question.trim();
    if (!q || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/query`, null, {
        params: { question: q },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Could not reach the backend. Make sure the server is running on port 8000." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div className="mm-page" style={{ display: "flex", flexDirection: "column", flex: 1 }}>

        <div className="page-header">
          <h1 className="page-title">Query AI</h1>
          <p className="page-sub">Encrypted in-memory RAG — data wiped after each response</p>
        </div>

        {/* Chat window */}
        <div style={{
          flex: 1,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          minHeight: 380,
        }}>
          <div style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingRight: 4,
          }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}>
            <input
              className="mm-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask MemoryMesh… (Enter to send)"
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              onClick={send}
              disabled={isLoading || !question.trim()}
              style={{ opacity: (isLoading || !question.trim()) ? 0.5 : 1 }}
            >
              Send
            </button>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default Query;