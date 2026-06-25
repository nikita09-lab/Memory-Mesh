import { useRef, useState, useLayoutEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: '◈' },
  { label: 'Query AI',  href: '/query',     icon: '◉' },
  { label: 'Forget Chat', href: '/forget-chat', icon: '◌' },
  { label: 'Delete User', href: '/delete-user', icon: '◍' },
  { label: 'Audit Proof', href: '/audit',    icon: '◎' },
];

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [bgStyle, setBgStyle] = useState({ left: 0, width: 0 });
  const btnRefs   = useRef([]);
  const wrapRef   = useRef(null);

  const activeIdx = NAV_ITEMS.findIndex(n => location.pathname === n.href);

  useLayoutEffect(() => {
    const el  = btnRefs.current[activeIdx];
    const wrap = wrapRef.current;
    if (!el || !wrap) return;
    const wR = wrap.getBoundingClientRect();
    const eR = el.getBoundingClientRect();
    setBgStyle({ left: eR.left - wR.left, width: eR.width });
  }, [activeIdx, location.pathname]);

  const logout = () => { localStorage.clear(); navigate('/login'); };
  const user   = localStorage.getItem('mm_username') || 'User';

  return (
    <nav style={{
      background: 'rgba(8,11,20,0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 28px',
      height: 58,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:34, height:34,
          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
          borderRadius:9, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:16, boxShadow:'0 0 14px rgba(124,58,237,.4)',
        }}>⬡</div>
        <span style={{ fontWeight:700, fontSize:16, letterSpacing:'-0.4px', color:'var(--text)' }}>
          Memory<span style={{ color:'var(--accent2)' }}>Mesh</span>
        </span>
      </div>

      {/* Gooey nav */}
      <div className="gooey-nav-wrap" ref={wrapRef} style={{ position:'relative' }}>
        {activeIdx >= 0 && (
          <div className="gooey-nav-bg" style={bgStyle} />
        )}
        {NAV_ITEMS.map((item, i) => (
          <button
            key={i}
            ref={el => btnRefs.current[i] = el}
            className={`gooey-nav-btn${activeIdx === i ? ' active' : ''}`}
            onClick={() => navigate(item.href)}
            style={{ display:'flex', alignItems:'center', gap:5 }}
          >
            <span style={{ fontSize:11, opacity:.7 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* User + logout */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          padding:'5px 12px', borderRadius:20,
          background:'var(--glow)', border:'1px solid var(--border2)',
          fontSize:12, color:'var(--accent2)', fontWeight:600,
        }}>
          {user}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={logout}
          style={{ gap:5, color:'#fca5a5', borderColor:'rgba(239,68,68,.25)' }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
          </svg>
          Sign out
        </button>
      </div>
    </nav>
  );
}
