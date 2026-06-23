import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API = "http://127.0.0.1:8000";

function Forget() {
  const [userId,  setUserId]  = useState("alice@example.com");
  const [result,  setResult]  = useState(null);
  const [flash,   setFlash]   = useState(null); // { msg, type }
  const [loading, setLoading] = useState(false);

  const showFlash = (msg, type = "ok") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 4000);
  };

  const forgetUser = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API}/forget`, null, {
        params: { user_id: userId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setResult(res.data); // ✅ Fixed: was called twice in original
      showFlash("Machine unlearning complete.", "ok");
    } catch (err) {
      const detail = err.response?.data?.detail || "Forget request failed.";
      showFlash(detail, "err");
    } finally {
      setLoading(false);
    }
  };

  const status = result?.status ?? "";
  const isNotFound = status.includes("not_found");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)" }}>
      <Navbar />
      <div className="mm-page">

        <div className="page-header">
          <h1 className="page-title">Forget User</h1>
          <p className="page-sub">Trigger SISA machine unlearning — permanently removes a user's data from model weights</p>
        </div>

        <div className="card" style={{ maxWidth: 560 }}>

          <div className="section-label">User Identifier</div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input
              className="mm-input"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") forgetUser(); }}
              placeholder="user@example.com"
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-danger"
              onClick={forgetUser}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Processing…" : "🗑️ Forget"}
            </button>
          </div>

          {flash && (
            <div className={`flash flash-${flash.type}`}>{flash.msg}</div>
          )}

          {result ? (
            <>
              <div className="section-label">Unlearning Result</div>
              <div style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: 16,
              }}>
                <div className="result-row">
                  <span className="result-key">Status</span>
                  <span className={`badge ${isNotFound ? "badge-warn" : "badge-success"}`}>
                    {isNotFound ? "⚠ User not found" : "✓ " + status}
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-key">User ID</span>
                  <span className="result-val">{userId}</span>
                </div>
                <div className="result-row">
                  <span className="result-key">Samples removed</span>
                  <span className="result-val">
                    {result.total_samples_removed ?? result.samples_removed ?? "—"}
                  </span>
                </div>
                <div className="result-row">
                  <span className="result-key">Retrain time</span>
                  <span className="result-val">
                    {result.total_retrain_time_sec != null
                      ? result.total_retrain_time_sec.toFixed(2) + "s"
                      : "—"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            !loading && (
              <div className="empty-state">
                <div className="empty-icon">🧹</div>
                Enter a user ID and click Forget to trigger SISA unlearning
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}

export default Forget;