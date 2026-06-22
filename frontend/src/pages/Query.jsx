import { useState } from "react";
import api from "../api/client";
import Navbar from "../components/Navbar";

function Query() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post("/query", null, {
        params: {
          question: userMessage.content,
        },
      });

      const botMessage = {
        role: "assistant",
        content: res.data.answer,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      alert("Query Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      askQuestion();
    }
  };

  return (
    <>
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "white",
          padding: "40px",
        }}
      >
        <h1>🤖 MemoryMesh Chat</h1>

        <div
          style={{
            maxWidth: "900px",
            margin: "30px auto",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                background: msg.role === "user" ? "#2563eb" : "#1e293b",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "15px",
              }}
            >
              <strong>
                {msg.role === "user" ? "👤 You" : "🤖 MemoryMesh"}
              </strong>

              <p>{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div
              style={{
                background: "#1e293b",
                padding: "15px",
                borderRadius: "12px",
                marginBottom: "15px",
                opacity: 0.7,
              }}
            >
              <strong>🤖 MemoryMesh</strong>
              <p>Thinking...</p>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            maxWidth: "900px",
            margin: "auto",
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MemoryMesh..."
            style={{
              flex: 1,
              padding: "15px",
              borderRadius: "10px",
            }}
          />

          <button
            onClick={askQuestion}
            disabled={loading}
            style={{
              padding: "15px 25px",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}

export default Query;
