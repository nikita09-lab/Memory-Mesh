import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const API = "http://127.0.0.1:8000";

const STATS = [
  { key: "total_users",        icon: "👥", label: "Total Users",        color: "var(--accent-dim)" },
  { key: "protected_memories", icon: "🧠", label: "Protected Memories", color: "var(--teal-dim)"   },
  { key: "forget_requests",    icon: "🗑️", label: "Forget Requests",    color: "var(--danger-dim)" },
  { key: "audit_events",       icon: "📋", label: "Audit Events",       color: "var(--purple-dim)" },
];

const FEATURES = [
  { to: "/query",  icon: "🔍", name: "Query AI",      desc: "Ask the encrypted in-memory RAG",    accent: "var(--accent-dim)"  },
  { to: "/forget", icon: "🗑️", name: "Forget User",   desc: "Trigger SISA machine unlearning",    accent: "var(--danger-dim)"  },
  { to: "/audit",  icon: "📋", name: "Audit Proof",   desc: "Cryptographic deletion verification", accent: "var(--purple-dim)" },
];

const SYSTEM_STATUS = [
  { color: "var(--teal)",   text: "AES-256 encryption active — all embeddings secured in RAM" },
  { color: "var(--accent)", text: "SISA sharding engine ready — selective retrain available"  },
  { color: "var(--purple)", text: "Merkle audit trail — append-only log with RFC 3161 timestamps" },
  { color: "var(--amber)",  text: "Differential privacy noise injected at embedding layer" },
];

function Dashboard() {
  const [stats, setStats] = useState({
    total_users: "—", protected_memories: "—",
    forget_requests: "—", audit_events: "—",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch {
        // stats are optional — fail silently
      }
    };
    load();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
      <Navbar />
      <div className="mm-page">

        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">System overview — Privacy-Preserving AI Memory</p>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 28,
        }}>
          {STATS.map(({ key, icon, label, color }) => (
            <div className="card" key={key} style={{ padding: "20px 16px" }}>
              <div style={{
                width: 36, height: 36,
                background: color,
                borderRadius: 9,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 17, marginBottom: 14,
              }}>{icon}</div>
              <div style={{
                fontSize: 28, fontWeight: 600, color: "var(--text)",
                letterSpacing: -1, lineHeight: 1, marginBottom: 5,
              }}>{stats[key]}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Quick access */}
        <div className="section-label">Quick Access</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, marginBottom: 28,
        }}>
          {FEATURES.map(({ to, icon, name, desc, accent }) => (
            <Link key={to} to={to} style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer" }}>
                <div style={{
                  width: 42, height: 42,
                  background: accent,
                  borderRadius: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 12,
                }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* System status */}
        <div className="section-label">System Status</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SYSTEM_STATUS.map(({ color, text }, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "12px 14px",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "var(--text)", flex: 1 }}>{text}</span>
              <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--mono)" }}>LIVE</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;