import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';


const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function ChatIcon() { return <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>; }
function ShieldIcon(){ return <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>; }

export default function ForgetChat() {
  const [result,  setResult]  = useState(null);
  const [flash,   setFlash]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const doForget = async () => {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true); setResult(null);
    try {
      const res = await axios.delete(`${API}/chat-history`, {
        headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` },
      });
      setResult(res.data);
      setFlash({ msg:'Chat history wiped and cryptographically logged.', type:'ok' });
      setConfirm(false);
    } catch (err) {
      setFlash({ msg: err.response?.data?.detail || 'Failed to clear history.', type:'err' });
    } finally { setLoading(false); setTimeout(()=>setFlash(null),4000); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth:680, margin:'0 auto', padding:'36px 24px' }}>

        <div className="fade-up" style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>Forget Chat</h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>
            Permanently wipe your conversation history — an audit event is logged to the Merkle trail.
          </p>
        </div>

        {/* Info banner */}
        <SpotlightCard spotlightColor="rgba(59,130,246,.15)" style={{ padding:'20px', marginBottom:20 }} className="fade-up">
          <div style={{ display:'flex', gap:14 }}>
            <div style={{ width:42, height:42, background:'var(--blue2)', border:'1px solid rgba(59,130,246,.3)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--blue)', flexShrink:0 }}>
              <ChatIcon />
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>What this does</div>
              <ul style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7, paddingLeft:16 }}>
                <li>Deletes all messages from your conversation history on the server</li>
                <li>Logs the deletion event to the immutable Merkle audit trail</li>
                <li>Generates a timestamped cryptographic proof (RFC 3161)</li>
                <li>Your local session view is also cleared</li>
              </ul>
            </div>
          </div>
        </SpotlightCard>

        {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}

        {/* Action card */}
        <SpotlightCard spotlightColor="rgba(59,130,246,.12)" style={{ padding:'24px' }} className="fade-up" style2={{ animationDelay:'.1s' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:15 }}>Clear My Chat History</div>
              <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                Logged as user: <span style={{ color:'var(--accent2)', fontFamily:'var(--mono)', fontSize:11 }}>
                  {localStorage.getItem('mm_username') || 'unknown'}
                </span>
              </div>
            </div>

            {confirm ? (
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#fca5a5' }}>Are you sure?</span>
                <button className="btn btn-red btn-sm" onClick={doForget} disabled={loading}>
                  {loading ? 'Wiping…' : 'Yes, Wipe'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setConfirm(false)}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={doForget}
                style={{ color:'#93c5fd', borderColor:'rgba(59,130,246,.3)' }}>
                <ChatIcon /> Forget Chat
              </button>
            )}
          </div>

          {result && (
            <div style={{ marginTop:20, paddingTop:18, borderTop:'1px solid var(--border)' }}>
              <div className="section-label">Result</div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:14 }}>
                {[
                  ['Status', <span className="badge badge-green"><ShieldIcon/> Wiped</span>],
                  ['Messages deleted', <span style={{ fontFamily:'var(--mono)', fontSize:12 }}>{result.count ?? result.deleted ?? 0}</span>],
                  ['Audit logged', <span className="badge badge-green">Yes</span>],
                  ['Merkle proof', <span className="badge badge-purple">Generated</span>],
                ].map(([k,v],i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i<3?'1px solid var(--border)':'none', fontSize:13 }}>
                    <span style={{ color:'var(--text2)' }}>{k}</span>{v}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}
