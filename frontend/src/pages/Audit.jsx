import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';

const API = 'http://127.0.0.1:8000';

function ShieldIcon() { return <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>; }
function CopyIcon()  { return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>; }

function Row({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
      <span style={{ color:'var(--text2)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function Audit() {
  const [userId,  setUserId]  = useState(localStorage.getItem('mm_username') || '');
  const [proof,   setProof]   = useState(null);
  const [flash,   setFlash]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const getProof = async () => {
    if (!userId.trim()) return;
    setLoading(true); setProof(null);
    try {
      const res = await axios.get(`${API}/audit-proof`, {
        params: { user_id: userId },
        headers: { Authorization:`Bearer ${localStorage.getItem('token')}` },
      });
      setProof(res.data);
      setFlash({ msg:'Cryptographic proof generated successfully.', type:'ok' });
    } catch (err) {
      setFlash({ msg: err.response?.data?.detail || 'Proof generation failed.', type:'err' });
    } finally { setLoading(false); setTimeout(()=>setFlash(null),4000); }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(proof, null, 2));
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth:680, margin:'0 auto', padding:'36px 24px' }}>

        <div className="fade-up" style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>Audit Proof</h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>
            Generate a cryptographic Merkle proof to verify data deletion — shareable with regulators.
          </p>
        </div>

        {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}

        <SpotlightCard spotlightColor="rgba(168,85,247,.15)" style={{ padding:'24px' }} className="fade-up">
          <div className="section-label">User Identifier</div>
          <div style={{ display:'flex', gap:10, marginBottom: proof ? 24 : 0 }}>
            <input className="mm-input" value={userId} onChange={e=>setUserId(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&getProof()} placeholder="username or user@example.com" style={{ flex:1 }} />
            <button className="btn btn-primary" onClick={getProof} disabled={loading||!userId.trim()}
              style={{ opacity:(loading||!userId.trim())?.5:1 }}>
              <ShieldIcon />{loading ? 'Generating…' : 'Generate Proof'}
            </button>
          </div>

          {proof && (
            <div className="fade-up">
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div className="section-label" style={{ margin:0 }}>Proof Result</div>
                <button className="btn btn-ghost btn-sm" onClick={copyJson}>
                  <CopyIcon />{copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'4px 14px' }}>
                <Row label="User ID" value={<span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--text)' }}>{proof.user_id}</span>} />
                <Row label="Events logged" value={<span style={{ fontFamily:'var(--mono)', fontSize:12 }}>{proof.event_count ?? '—'}</span>} />
                <Row label="Deletion confirmed" value={
                  proof.deletion_confirmed
                    ? <span className="badge badge-green"><ShieldIcon/> Yes</span>
                    : <span className="badge badge-amber">Not yet</span>
                } />
                <div style={{ padding:'9px 0', fontSize:13 }}>
                  <div style={{ color:'var(--text2)', marginBottom:8 }}>Merkle Root</div>
                  <div style={{
                    fontFamily:'var(--mono)', fontSize:11, color:'var(--accent2)',
                    wordBreak:'break-all', background:'rgba(124,58,237,.07)',
                    border:'1px solid rgba(124,58,237,.2)', borderRadius:8, padding:12,
                    lineHeight:1.6,
                  }}>
                    {proof.merkle_root || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Compliance note */}
              <div style={{ marginTop:16, padding:'12px 14px', background:'var(--teal2)', border:'1px solid rgba(6,214,160,.2)', borderRadius:'var(--r)', fontSize:12, color:'var(--teal)', display:'flex', alignItems:'center', gap:8 }}>
                <ShieldIcon />
                This proof can be presented to a regulator without revealing any actual user data. Copy JSON for export.
              </div>
            </div>
          )}

          {!proof && !loading && (
            <div style={{ textAlign:'center', padding:'32px 0', color:'var(--text3)' }}>
              <div style={{ fontSize:32, marginBottom:10, opacity:.3 }}><ShieldIcon/></div>
              Enter a user ID and click Generate Proof
            </div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}
