import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function Forget() {
  const [userId, setUserId] = useState("alice@example.com");
  const [result, setResult] = useState(null);

  const forgetUser = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post("http://127.0.0.1:8000/forget", null, {
        params: {
          user_id: userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setResult(res.data);
      console.log(res.data);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Forget Failed");
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
      <h1>🗑 Forget User</h1>

      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{
          width: "400px",
          padding: "12px",
        }}
      />

      <button
        style={{
          marginLeft: "10px",
          padding: "12px",
        }}
        onClick={forgetUser}
      >
        Forget
      </button>

      {result && (
        <div
          style={{
            marginTop: "30px",
            background: "#1e293b",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h3>Unlearning Result</h3>

          <p>Status: {result.status}</p>

          <p>Samples Removed: {result.total_samples_removed}</p>

          <p>Retrain Time: {result.total_retrain_time_sec}</p>
        </div>
      )}
    </div>
    </>
  );
}

export default Forget;
