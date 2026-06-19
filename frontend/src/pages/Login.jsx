import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/login", null, {
        params: {
          username,
          password,
        },
      });

      localStorage.setItem("token", res.data.access_token);
      console.log("TOKEN SAVED:", res.data.access_token);

      navigate("/dashboard");
    } catch (err) {
      alert("Login Failed");
    }
  };

  return (
    <div style={{ padding: "50px" }}>
      <h1>MemoryMesh Login</h1>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />
      <br />

      <button onClick={login}>Login</button>
    </div>
  );
}

export default Login;
