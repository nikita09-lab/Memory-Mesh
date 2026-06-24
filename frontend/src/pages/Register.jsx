import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';

const API = 'http://127.0.0.1:8000';

export default function Register() {
  const [form, setForm] = useState({ username:'', password:'', email:'' });
  const [error, setError]   = useState('');
  const [ok, setOk]         = useState('');
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
      minHeight:'100vh', background:'var(--bg)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, position:'relative', overflow:'hidden',
    }}>
      {[['30%','60%','rgba(124,58,237,.15)'],['75%','25%','rgba(236,72,153,.10)']].map(([x,y,c],i)=>(
        <div key={i} style={{ position:'absolute', left:x, top:y, width:360, height:360,
          background:`radial-gradient(circle, ${c}, transparent 70%)`,
          transform:'translate(-50%,-50%)', pointerEvents:'none' }}/>
      ))}

      <SpotlightCard style={{ width:'100%', maxWidth:420, padding:'40px 36px' }} spotlightColor="rgba(168,85,247,.18)">
        <div className="fade-up">
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{
              width:54, height:54,
              background:'linear-gradient(135deg,#a855f7,#ec4899)',
              borderRadius:15, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:26, margin:'0 auto 16px',
              boxShadow:'0 0 24px rgba(168,85,247,.4)',
            }}>⬡</div>
            <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>Create Account</h1>
            <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>Join MemoryMesh today</p>
          </div>

          {error && <div className="flash flash-err">{error}</div>}
          {ok    && <div className="flash flash-ok">{ok}</div>}

          {[
            { key:'username', label:'Username', type:'text', ph:'Choose a username' },
            { key:'email',    label:'Email (optional)', type:'email', ph:'you@example.com' },
            { key:'password', label:'Password', type:'password', ph:'Min. 4 characters' },
          ].map(({ key, label, type, ph }) => (
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{label}</label>
              <input className="mm-input" type={type} value={form[key]} onChange={set(key)} onKeyDown={e=>e.key==='Enter'&&register()} placeholder={ph} />
            </div>
          ))}

          <button className="btn btn-primary" onClick={register} disabled={loading}
            style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:14, marginTop:10, opacity:loading?.6:1 }}>
            {loading ? 'Creating account…' : 'Create Account'}
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
