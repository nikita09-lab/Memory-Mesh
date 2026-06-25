import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';

const API = 'http://127.0.0.1:8000';

const STAT_CFG = [
  { key:'total_users',        label:'Total Users',        icon: <UserIcon />,   color:'#7c3aed', glow:'rgba(124,58,237,.25)' },
  { key:'protected_memories', label:'Protected Memories', icon: <MemIcon />,    color:'#06d6a0', glow:'rgba(6,214,160,.2)'  },
  { key:'forget_requests',    label:'Forget Events',      icon: <TrashIcon />,  color:'#ef4444', glow:'rgba(239,68,68,.2)'  },
  { key:'audit_events',       label:'Audit Events',       icon: <AuditIcon />,  color:'#a855f7', glow:'rgba(168,85,247,.2)' },
];

function UserIcon()  { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20H7a5 5 0 015-5 5 5 0 015 5zm-5-7a4 4 0 100-8 4 4 0 000 8z"/></svg>; }
function MemIcon()   { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6z"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v6h6"/></svg>; }
function TrashIcon() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1H5a1 1 0 000 2h14a1 1 0 000-2h-2z"/></svg>; }
function AuditIcon() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>; }

const QUICK = [
  { label:'Query AI',      href:'/query',       color:'#7c3aed', desc:'Encrypted in-memory RAG',
    icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg> },
  { label:'Forget Chat',   href:'/forget-chat', color:'#3b82f6', desc:'Wipe conversation history',
    icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> },
  { label:'Delete User',   href:'/delete-user', color:'#ef4444', desc:'Permanently remove a user',
    icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg> },
  { label:'Audit Proof',   href:'/audit',       color:'#06d6a0', desc:'Cryptographic deletion proof',
    icon:<svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> },
];

const STATUS = [
  { dot:'#06d6a0', text:'AES-256 encryption active — all embeddings secured in RAM' },
  { dot:'#7c3aed', text:'SISA sharding engine ready — selective retrain on demand' },
  { dot:'#a855f7', text:'Merkle audit trail — append-only log with RFC 3161 timestamps' },
  { dot:'#f59e0b', text:'Differential privacy noise injected at embedding layer' },
];

export default function Dashboard() {
  const [stats, setStats]   = useState({ total_users:'—', protected_memories:'—', forget_requests:'—', audit_events:'—' });
  const [user,  setUser]    = useState(localStorage.getItem('mm_username') || 'User');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res   = await axios.get(`${API}/stats`, { headers:{ Authorization:`Bearer ${token}` } });
        setStats(res.data);
      } catch {}
    };
    load();
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth:1080, margin:'0 auto', padding:'36px 28px' }}>

        {/* Welcome */}
        <div className="fade-up" style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.6px' }}>
            Welcome back, <span style={{ color:'var(--accent2)' }}>{user}</span>
          </h1>
          <p style={{ color:'var(--text2)', marginTop:4, fontSize:14 }}>
            Your privacy-first AI memory system — all systems operational
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:32 }}>
          {STAT_CFG.map(({ key, label, icon, color, glow }, i) => (
            <SpotlightCard key={key} spotlightColor={glow}
              className="fade-up" style={{ animationDelay:`${i*.07}s`, padding:'22px 18px' }}>
              <div style={{
                width:44, height:44, borderRadius:12,
                background:`${color}18`, border:`1px solid ${color}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
                color, marginBottom:14,
              }}>{icon}</div>
              <div style={{ fontSize:32, fontWeight:700, letterSpacing:'-1.5px', lineHeight:1, color:'var(--text)', marginBottom:5 }}>
                {stats[key]}
              </div>
              <div style={{ fontSize:12, color:'var(--text2)' }}>{label}</div>
            </SpotlightCard>
          ))}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:18, marginBottom:28 }}>
          {/* Quick access */}
          <div>
            <div className="section-label">Quick Access</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {QUICK.map(({ label, href, color, desc, icon }, i) => (
                <SpotlightCard key={href} spotlightColor={`${color}22`}
                  className="fade-up" style={{ animationDelay:`${.2+i*.08}s`, padding:'20px 18px', cursor:'pointer' }}
                  onClick={() => navigate(href)}>
                  <div style={{
                    width:44, height:44, borderRadius:11,
                    background:`${color}18`, border:`1px solid ${color}28`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color, marginBottom:12,
                  }}>{icon}</div>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:12, color:'var(--text2)' }}>{desc}</div>
                </SpotlightCard>
              ))}
            </div>
          </div>

          {/* System status */}
          <div>
            <div className="section-label">System Status</div>
            <SpotlightCard style={{ padding:'18px' }} spotlightColor="rgba(124,58,237,.12)">
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {STATUS.map(({ dot, text }, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{
                      width:8, height:8, borderRadius:'50%', background:dot,
                      marginTop:5, flexShrink:0,
                      boxShadow:`0 0 6px ${dot}`,
                      animation:'pulse-dot 2.5s infinite',
                      animationDelay:`${i*.4}s`,
                    }}/>
                    <span style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop:18, paddingTop:14, borderTop:'1px solid var(--border)',
                display:'flex', alignItems:'center', justifyContent:'space-between',
              }}>
                <span style={{ fontSize:11, color:'var(--text3)' }}>All systems</span>
                <span className="badge badge-green" style={{ fontSize:10 }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--teal)', display:'inline-block' }}/>
                  Operational
                </span>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Compliance banner */}
        <SpotlightCard spotlightColor="rgba(245,158,11,.12)" style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'var(--amber2)', border:'1px solid rgba(245,158,11,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>Compliance Certified</div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>Mapped to GDPR · EU AI Act Art. 10/17 · India DPDP Section 8</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <span className="badge badge-amber">GDPR</span>
              <span className="badge badge-purple">EU AI Act</span>
              <span className="badge badge-blue">DPDP</span>
            </div>
          </div>
        </SpotlightCard>

      </div>
      <style>{`@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
