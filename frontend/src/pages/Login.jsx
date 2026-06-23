import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000";

function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/dashboard");
  }, [navigate]);

  const login = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/login`, null, {
        params: { username, password },
      });
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") login(); };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-deep)",
      padding: 20,
    }}>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "40px 36px",
        width: "100%",
        maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{
          width: 56,
          height: 56,
          background: "linear-gradient(135deg, #6378ff, #a855f7)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          margin: "0 auto 20px",
        }}>🧠</div>

        <h1 style={{
          textAlign: "center",
          fontSize: 22,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: -0.5,
          marginBottom: 4,
        }}>MemoryMesh</h1>

        <p style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-dim)",
          marginBottom: 28,
        }}>Privacy-Preserving AI Memory System</p>

        {error && (
          <div className="flash flash-err">{error}</div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: "block",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            marginBottom: 6,
          }}>Username</label>
          <input
            className="mm-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Username"
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={{
            display: "block",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            marginBottom: 6,
          }}>Password</label>
          <input
            className="mm-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Password"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={login}
          disabled={loading}
          style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p style={{
          textAlign: "center",
          marginTop: 14,
          fontSize: 12,
          color: "var(--text-faint)",
          fontFamily: "var(--mono)",
        }}>admin / admin123</p>
      </div>
    </div>
  );
}

export default Login;