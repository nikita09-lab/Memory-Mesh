import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div
      style={{
        background: "#1e293b",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
      }}
    >
      <h2>🧠 MemoryMesh</h2>

      <div
        style={{
          display: "flex",
          gap: "15px",
          alignItems: "center",
        }}
      >
        <Link
          to="/dashboard"
          style={{
            color: "white",
            textDecoration: "none",
          }}
        >
          Dashboard
        </Link>

        <Link
          to="/query"
          style={{
            color: "white",
            textDecoration: "none",
          }}
        >
          Query AI
        </Link>

        <Link
          to="/forget"
          style={{
            color: "white",
            textDecoration: "none",
          }}
        >
          Forget User
        </Link>

        <Link
          to="/audit"
          style={{
            color: "white",
            textDecoration: "none",
          }}
        >
          Audit Proof
        </Link>

        <button
          onClick={logout}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            padding: "8px 15px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;