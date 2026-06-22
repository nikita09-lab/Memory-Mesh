import { useState } from "react";
import axios from "axios";

function Query() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    try {
      const token = localStorage.getItem("token");

      const userMessage = {
        role: "user",
        content: question,
      };

      setMessages((prev) => [...prev, userMessage]);

      const res = await axios.post(
        "http://127.0.0.1:8000/query",
        null,
        {
          params: {
            question,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const botMessage = {
        role: "assistant",
        content: res.data.answer,
      };

      setMessages((prev) => [...prev, botMessage]);

      setQuestion("");
    } catch (err) {
      console.error(err);
      alert("Query Failed");
    }
  };

  return (
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
              background:
                msg.role === "user"
                  ? "#2563eb"
                  : "#1e293b",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "15px",
            }}
          >
            <strong>
              {msg.role === "user"
                ? "👤 You"
                : "🤖 MemoryMesh"}
            </strong>

            <p>{msg.content}</p>
          </div>
        ))}
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
          onChange={(e) =>
            setQuestion(e.target.value)
          }
          placeholder="Ask MemoryMesh..."
          style={{
            flex: 1,
            padding: "15px",
            borderRadius: "10px",
          }}
        />

        <button
          onClick={askQuestion}
          style={{
            padding: "15px 25px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Query;