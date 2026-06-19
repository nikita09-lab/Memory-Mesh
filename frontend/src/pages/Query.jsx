import { useState } from "react";
import axios from "axios";

function Query() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askQuestion = async () => {
    try {
      const token = localStorage.getItem("token");

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

      setAnswer(res.data.answer);
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
      <h1>🔍 Query MemoryMesh</h1>

      <input
        style={{
          width: "400px",
          padding: "12px",
        }}
        placeholder="Ask a question..."
        value={question}
        onChange={(e) =>
          setQuestion(e.target.value)
        }
      />

      <button
        style={{
          marginLeft: "10px",
          padding: "12px",
        }}
        onClick={askQuestion}
      >
        Ask
      </button>

      {answer && (
        <div
          style={{
            marginTop: "30px",
            background: "#1e293b",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h3>Answer</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default Query;
