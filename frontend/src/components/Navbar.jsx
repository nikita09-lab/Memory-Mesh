import { Link, useNavigate, useLocation } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/query",     label: "Query AI"  },
  { to: "/forget",    label: "Forget User" },
  { to: "/audit",     label: "Audit Proof" },
];

const navStyle = {
  background: "var(--bg-surface)",
  borderBottom: "1px solid var(--border)",
  padding: "0 28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "54px",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "15px",
  fontWeight: 600,
  letterSpacing: "-0.3px",
  color: "var(--text)",
};

const logoStyle = {
  width: 30,
  height: 30,
  background: "linear-gradient(135deg, #6378ff, #a855f7)",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
};

function Navbar() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const linkBase = {
    padding: "6px 13px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 400,
    transition: "background 0.15s, color 0.15s",
    cursor: "pointer",
    border: "none",
    fontFamily: "var(--font)",
  };

  return (
    <nav style={navStyle}>
      <div style={brandStyle}>
        <div style={logoStyle}>🧠</div>
        MemoryMesh
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        {links.map(({ to, label }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} style={{ textDecoration: "none" }}>
              <span
                style={{
                  ...linkBase,
                  display: "inline-block",
                  background: active ? "var(--accent-dim)" : "transparent",
                  color: active ? "#a0b4ff" : "var(--text-dim)",
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={logout}
          style={{
            ...linkBase,
            background: "rgba(255,77,109,0.08)",
            border: "1px solid rgba(255,77,109,0.25)",
            color: "#ff8a9e",
            marginLeft: 8,
            fontWeight: 500,
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;