import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function Audit() {
  const [userId, setUserId] = useState("alice@example.com");
  const [proof, setProof] = useState(null);

  const getProof = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://127.0.0.1:8000/audit-proof",
        {
          params: {
            user_id: userId,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res.data);
      setProof(res.data);
    } catch (err) {
      console.error(err);
      alert("Audit Proof Failed");
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
      <h1>📜 Audit Proof</h1>

      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{
          width: "400px",
          padding: "12px",
        }}
      />

      <button
        onClick={getProof}
        style={{
          marginLeft: "10px",
          padding: "12px",
        }}
      >
        Generate Proof
      </button>

      {proof && (
        <div
          style={{
            marginTop: "30px",
            background: "#1e293b",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h2>Audit Result</h2>

          <p>
            <b>User:</b> {proof.user_id}
          </p>

          <p>
            <b>Events:</b> {proof.event_count}
          </p>

          <p>
            <b>Deletion Confirmed:</b>{" "}
            {proof.deletion_confirmed ? "✅ Yes" : "❌ No"}
          </p>

          <p>
            <b>Merkle Root:</b>
          </p>

          <div
            style={{
              wordBreak: "break-all",
              fontSize: "12px",
            }}
          >
            {proof.merkle_root}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default Audit;