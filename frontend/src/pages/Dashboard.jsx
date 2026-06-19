import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px",
      }}
    >
      <h1>🧠 MemoryMesh Dashboard</h1>

      <p>
        Privacy-Preserving AI Memory System
      </p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "30px",
          flexWrap: "wrap",
        }}
      >
        <Link to="/query">
          <button style={{ padding: "15px" }}>
            🔍 Query AI
          </button>
        </Link>

        <Link to="/forget">
          <button style={{ padding: "15px" }}>
            🗑 Forget User
          </button>
        </Link>

        <Link to="/audit">
          <button style={{ padding: "15px" }}>
            📜 Audit Proof
          </button>
        </Link>
      </div>

      <div
        style={{
          marginTop: "40px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "10px",
            width: "250px",
          }}
        >
          <h3>🔐 Security</h3>
          <p>AES-256 Encryption</p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "10px",
            width: "250px",
          }}
        >
          <h3>🧹 Unlearning</h3>
          <p>SISA Machine Unlearning</p>
        </div>

        <div
          style={{
            background: "#1e293b",
            padding: "20px",
            borderRadius: "10px",
            width: "250px",
          }}
        >
          <h3>📋 Compliance</h3>
          <p>Audit Proof Generation</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
