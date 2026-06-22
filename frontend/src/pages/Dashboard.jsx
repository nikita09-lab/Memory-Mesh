import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";
import Navbar from "../components/Navbar";

function Dashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    protected_memories: 0,
    forget_requests: 0,
    audit_events: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/stats");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, []);

  const cardStyle = {
    background: "#1e293b",
    padding: "25px",
    borderRadius: "12px",
    width: "220px",
    textAlign: "center",
    boxShadow: "0px 4px 15px rgba(0,0,0,0.3)",
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
        <h1
          style={{
            textAlign: "center",
            fontSize: "60px",
          }}
        >
          🧠 MemoryMesh Dashboard
        </h1>

        <p
          style={{
            textAlign: "center",
            fontSize: "24px",
            marginBottom: "40px",
          }}
        >
          Privacy-Preserving AI Memory System
        </p>

        {/* Stats Cards */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <div style={cardStyle}>
            <h2>👥</h2>
            <h1>{stats.total_users}</h1>
            <p>Total Users</p>
          </div>

          <div style={cardStyle}>
            <h2>🧠</h2>
            <h1>{stats.protected_memories}</h1>
            <p>Protected Memories</p>
          </div>

          <div style={cardStyle}>
            <h2>🗑</h2>
            <h1>{stats.forget_requests}</h1>
            <p>Forget Requests</p>
          </div>

          <div style={cardStyle}>
            <h2>📜</h2>
            <h1>{stats.audit_events}</h1>
            <p>Audit Events</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "40px",
          }}
        >
          <Link to="/query">
            <button style={{ padding: "15px 25px" }}>🔍 Query AI</button>
          </Link>

          <Link to="/forget">
            <button style={{ padding: "15px 25px" }}>🗑 Forget User</button>
          </Link>

          <Link to="/audit">
            <button style={{ padding: "15px 25px" }}>📜 Audit Proof</button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div
          style={{
            display: "flex",
            gap: "25px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              padding: "30px",
              borderRadius: "12px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h2>🔐 Security</h2>
            <p>AES-256 Encryption</p>
          </div>

          <div
            style={{
              background: "#1e293b",
              padding: "30px",
              borderRadius: "12px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h2>🧹 Unlearning</h2>
            <p>SISA Machine Unlearning</p>
          </div>

          <div
            style={{
              background: "#1e293b",
              padding: "30px",
              borderRadius: "12px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h2>📋 Compliance</h2>
            <p>Audit Proof Generation</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
