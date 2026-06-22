import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const login = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/login",
        null,
        {
          params: {
            username,
            password,
          },
        }
      );

      localStorage.setItem(
        "token",
        res.data.access_token
      );

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Login Failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "12px",
          width: "400px",
          color: "white",
          textAlign: "center",
        }}
      >
        <h1>🧠 MemoryMesh</h1>

        <p>Privacy-Preserving AI Memory System</p>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "15px",
          }}
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
          }}
        />

        <br />
        <br />

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
