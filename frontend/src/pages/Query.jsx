import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';


const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WELCOME = { role:'assistant', content:"Hello! I'm MemoryMesh — your privacy-aware AI assistant. Ask me anything. Your session is AES-256 encrypted and all embeddings are wiped the moment I answer.", ts: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };

function SendIcon() { return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>; }
function ClearIcon(){ return <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1H5a1 1 0 000 2h14a1 1 0 000-2h-2z"/></svg>; }
function LockIcon() { return <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>; }

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display:'flex', flexDirection:isUser?'row-reverse':'row', gap:10, alignItems:'flex-start' }}>
      <div style={{
        width:32, height:32, borderRadius:'50%', flexShrink:0,
        background: isUser ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'linear-gradient(135deg,#06d6a0,#059669)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:13, fontWeight:700, color:'#fff',
        boxShadow: isUser ? '0 0 8px rgba(124,58,237,.4)' : '0 0 8px rgba(6,214,160,.3)',
      }}>
        {isUser ? (localStorage.getItem('mm_username')||'U')[0].toUpperCase() : '⬡'}
      </div>
      <div style={{ maxWidth:'76%' }}>
        <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)', marginBottom:4, textAlign:isUser?'right':'left' }}>
          {isUser ? (localStorage.getItem('mm_username')||'You') : 'MemoryMesh'} · {msg.ts}
        </div>
        <div style={{
          padding:'11px 15px', borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
          background: isUser ? 'linear-gradient(135deg,rgba(124,58,237,.25),rgba(168,85,247,.2))' : 'var(--card2)',
          border: isUser ? '1px solid rgba(124,58,237,.3)' : '1px solid var(--border)',
          fontSize:13, lineHeight:1.65, color:'var(--text)',
        }}>
          {msg.content}
          {!isUser && (
            <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:4, color:'var(--teal)' }}>
              <LockIcon /><span style={{ fontSize:10, fontFamily:'var(--mono)' }}>encrypted · wiped after response</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#06d6a0,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff', fontWeight:700 }}>⬡</div>
      <div style={{ display:'flex', alignItems:'center', gap:5, padding:'12px 16px', background:'var(--card2)', border:'1px solid var(--border)', borderRadius:'4px 14px 14px 14px' }}>
        {[0,.2,.4].map((d,i)=>(
          <span key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--text2)', display:'inline-block', animation:`typing-dot 1.2s ${d}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

export default function Query() {
  const [messages,  setMessages]  = useState([WELCOME]);
  const [question,  setQuestion]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [clearing,  setClearing]  = useState(false);
  const [flash,     setFlash]     = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  const send = async () => {
    const q = question.trim();
    if (!q || loading) return;
    const ts = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    setMessages(p => [...p, { role:'user', content:q, ts }]);
    setQuestion(''); setLoading(true);
    try {
      const res = await axios.post(`${API}/query`, { question: q }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessages(p => [...p, { role:'assistant', content:res.data.answer, ts: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }]);
    } catch {
      setMessages(p => [...p, { role:'assistant', content:'Could not reach backend. Make sure the server is running on port 8000.', ts:'now' }]);
    } finally { setLoading(false); }
  };

  const clearChat = async () => {
    setClearing(true);
    try {
      await axios.delete(`${API}/chat-history`, { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } });
      setMessages([WELCOME]);
      setFlash({ msg:'Chat history cleared and logged to audit trail.', type:'ok' });
    } catch { setFlash({ msg:'Could not clear history.', type:'err' }); }
    finally { setClearing(false); setTimeout(()=>setFlash(null),3500); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <div style={{ maxWidth:860, width:'100%', margin:'0 auto', padding:'28px 24px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>Query AI</h1>
            <p style={{ color:'var(--text2)', fontSize:13, marginTop:2 }}>Encrypted in-memory RAG — zero-persistence after each response</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={clearChat} disabled={clearing}
            style={{ gap:6, color:'#fca5a5', borderColor:'rgba(239,68,68,.25)' }}>
            <ClearIcon /> {clearing ? 'Clearing…' : 'Clear History'}
          </button>
        </div>

        {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}

        <SpotlightCard spotlightColor="rgba(124,58,237,.1)" style={{ flex:1, display:'flex', flexDirection:'column', padding:20, minHeight:420 }}>
          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:14, paddingRight:4 }}>
            {messages.map((m,i) => <Bubble key={i} msg={m} />)}
            {loading && <Typing />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
            <input
              className="mm-input" value={question}
              onChange={e=>setQuestion(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
              placeholder="Ask MemoryMesh… (Enter to send)"
              disabled={loading} style={{ flex:1 }}
            />
            <button className="btn btn-primary" onClick={send}
              disabled={loading||!question.trim()} style={{ opacity:(loading||!question.trim())?.5:1 }}>
              <SendIcon /> Send
            </button>
          </div>
        </SpotlightCard>
      </div>
      <style>{`@keyframes typing-dot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}
