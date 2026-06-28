/**
 * Login.jsx
 *
 * FIXED:
 *  - Credentials sent as JSON body (POST /login), not query params.
 *    Passwords no longer appear in server logs or browser history.
 *  - Removed "demo: admin / admin123" hint from production UI.
 *  - API URL from env variable.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) navigate('/dashboard');
  }, []);

  const login = async () => {
    if (!username.trim() || !password) return;
    setError(''); setLoading(true);
    try {
      // FIXED: JSON body — never query params
      const res = await axios.post(`${API}/login`, { username, password });
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('mm_username', res.data.username || username);
      localStorage.setItem('mm_role', res.data.role || 'user');
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Invalid username or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, position:'relative', overflow:'hidden',
    }}>
      {/* BG blobs */}
      {[['20%','30%','rgba(124,58,237,.18)'],['80%','70%','rgba(168,85,247,.12)'],['60%','20%','rgba(236,72,153,.10)']].map(([x,y,c],i)=>(
        <div key={i} style={{
          position:'absolute', left:x, top:y, width:400, height:400,
          background:`radial-gradient(circle, ${c}, transparent 70%)`,
          transform:'translate(-50%,-50%)', pointerEvents:'none',
        }}/>
      ))}

      <SpotlightCard style={{ width:'100%', maxWidth:400, padding:'40px 36px' }} spotlightColor="rgba(124,58,237,.2)">
        <div className="fade-up">
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{
              width:54, height:54,
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',
              borderRadius:15, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:26, margin:'0 auto 16px',
              boxShadow:'0 0 24px rgba(124,58,237,.5)',
            }}>⬡</div>
            <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>
              Memory<span style={{ color:'#a78bfa' }}>Mesh</span>
            </h1>
            <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>Sign in to your account</p>
          </div>

          {error && <div className="flash flash-err">{error}</div>}

          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>Username</label>
            <input className="mm-input" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Username" autoComplete="username" />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>Password</label>
            <input className="mm-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Password" autoComplete="current-password" />
          </div>

          <button className="btn btn-primary" onClick={login} disabled={loading || !username.trim() || !password}
            style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14, opacity:loading?.6:1 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--text2)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--accent2)', fontWeight:600 }}>Sign up</Link>
          </p>
          {/* REMOVED: "demo: admin / admin123" hint */}
        </div>
      </SpotlightCard>
    </div>
  );
}
