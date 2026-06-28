import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Register() {
  const [form, setForm]       = useState({ username: '', password: '', email: '' });
  const [error, setError]     = useState('');
  const [ok, setOk]           = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const register = async () => {
    setError(''); setOk(''); setLoading(true);
    try {
      await axios.post(`${API}/register`, form);
      setOk('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1400);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* BG blobs */}
      {[['20%','30%','rgba(124,58,237,.18)'],['80%','70%','rgba(168,85,247,.12)'],['60%','20%','rgba(236,72,153,.10)']].map(([x,y,c],i)=>(
        <div key={i} style={{
          position:'absolute', left:x, top:y, width:400, height:400,
          background:`radial-gradient(circle, ${c}, transparent 70%)`,
          transform:'translate(-50%,-50%)', pointerEvents:'none',
        }}/>
      ))}

      <SpotlightCard style={{ width:'100%', maxWidth:420, padding:'40px 36px' }} spotlightColor="rgba(124,58,237,.2)">
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
            <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>Create your account</p>
          </div>

          {error && <div className="flash flash-err">{error}</div>}
          {ok    && <div className="flash flash-ok">{ok}</div>}

          {/* Username */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
              Username <span style={{ color:'#f87171' }}>*</span>
            </label>
            <input
              className="mm-input"
              value={form.username}
              onChange={set('username')}
              onKeyDown={e => e.key === 'Enter' && register()}
              placeholder="3–32 characters"
              autoComplete="username"
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
              Email <span style={{ color:'var(--text3)', fontWeight:400, textTransform:'none' }}>(optional)</span>
            </label>
            <input
              className="mm-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              onKeyDown={e => e.key === 'Enter' && register()}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
              Password <span style={{ color:'#f87171' }}>*</span>
            </label>
            <input
              className="mm-input"
              type="password"
              value={form.password}
              onChange={set('password')}
              onKeyDown={e => e.key === 'Enter' && register()}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:5 }}>
              Use at least 8 characters with letters and numbers.
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={register}
            disabled={loading || !form.username.trim() || !form.password}
            style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14,
              opacity: (loading || !form.username.trim() || !form.password) ? 0.6 : 1 }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--text2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent2)', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </SpotlightCard>
    </div>
  );
}