import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import LiquidEther from '../components/LiquidEther.jsx'; 
/* Animated fluid canvas background */
<div style={{ width: '100%', height: 600, position: 'relative' }}>
  <LiquidEther
    colors={[ '#5227FF', '#FF9FFC', '#B497CF' ]}
    mouseForce={20}
    cursorSize={100}
    isViscous
    viscous={30}
    iterationsViscous={32}
    iterationsPoisson={32}
    resolution={0.5}
    isBounce={false}
    autoDemo
    autoSpeed={0.5}
    autoIntensity={2.2}
    takeoverDuration={0.25}
    autoResumeDelay={3000}
    autoRampDuration={0.6}
    color0="#5227FF"
    color1="#FF9FFC"
    color2="#B497CF"
/>
</div>


/* Floating stat pill */
function StatPill({ icon, label, value, delay }) {
  return (
    <div className="fade-up" style={{
      animationDelay: delay,
      background:'rgba(15,22,35,0.85)',
      backdropFilter:'blur(12px)',
      border:'1px solid var(--border2)',
      borderRadius:12,
      padding:'14px 20px',
      display:'flex', alignItems:'center', gap:12,
      minWidth:160,
    }}>
      <div style={{
        width:38, height:38,
        background:'var(--glow)',
        borderRadius:10,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.5px' }}>{value}</div>
        <div style={{ fontSize:11, color:'var(--text2)' }}>{label}</div>
      </div>
    </div>
  );
}

/* Feature card */
function FeatureCard({ icon, title, desc, color, delay }) {
  const divRef = useRef(null);
  const handleMouseMove = (e) => {
    const rect = divRef.current.getBoundingClientRect();
    divRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    divRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    divRef.current.style.setProperty('--spotlight-color', `${color}22`);
  };
  return (
    <div ref={divRef} onMouseMove={handleMouseMove}
      className="card-spotlight fade-up"
      style={{ animationDelay: delay, padding:'28px 24px' }}
    >
      <div style={{
        width:46, height:46, borderRadius:12,
        background:`${color}18`,
        border:`1px solid ${color}33`,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, marginBottom:16,
      }}>{icon}</div>
      <h3 style={{ fontSize:15, fontWeight:600, marginBottom:7, color:'var(--text)' }}>{title}</h3>
      <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{desc}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', overflow:'hidden' }}>

      {/* HERO */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <LiquidEther colors={['#7c3aed', '#a855f7', '#ec4899']} />

        {/* Top bar */}
        <div style={{
          position:'relative', zIndex:10,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'20px 48px',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34,
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',
              borderRadius:9, display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:16, boxShadow:'0 0 14px rgba(124,58,237,.5)',
            }}>⬡</div>
            <span style={{ fontWeight:700, fontSize:17, color:'var(--text)', letterSpacing:'-0.4px' }}>
              Memory<span style={{ color:'#a78bfa' }}>Mesh</span>
            </span>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign in</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get started</button>
          </div>
        </div>

        {/* Hero content */}
        <div style={{
          position:'relative', zIndex:10, flex:1,
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          textAlign:'center', padding:'0 24px 60px',
        }}>
          <div className="fade-up" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(124,58,237,.12)',
            border:'1px solid rgba(124,58,237,.3)',
            borderRadius:20, padding:'5px 14px',
            fontSize:12, fontWeight:600, color:'#a78bfa',
            marginBottom:28,
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#06d6a0',
              display:'inline-block', animation:'pulse-dot 2s infinite' }} />
            Privacy-Preserving AI Memory System
          </div>

          <h1 className="fade-up" style={{
            fontSize:'clamp(38px,6vw,72px)',
            fontWeight:700, lineHeight:1.1,
            letterSpacing:'-2px',
            marginBottom:22,
            animationDelay:'.1s',
          }}>
            Your AI Memory,<br />
            <span style={{ background:'linear-gradient(90deg,#7c3aed,#a855f7,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Cryptographically Protected
            </span>
          </h1>

          <p className="fade-up" style={{
            fontSize:'clamp(15px,2vw,18px)', color:'var(--text2)',
            maxWidth:540, lineHeight:1.7,
            marginBottom:40, animationDelay:'.2s',
          }}>
            AES-256 encrypted embeddings, SISA machine unlearning, Merkle audit trails — the most privacy-forward AI memory platform ever built.
          </p>

          <div className="fade-up" style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center', animationDelay:'.3s' }}>
            <button className="btn btn-primary"
              style={{ padding:'13px 30px', fontSize:15, boxShadow:'0 0 24px rgba(124,58,237,.5)' }}
              onClick={() => navigate('/register')}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Start Free
            </button>
            <button className="btn btn-ghost" style={{ padding:'13px 30px', fontSize:15 }}
              onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>

          {/* Stats row */}
          <div className="fade-up" style={{
            display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center',
            marginTop:56, animationDelay:'.45s',
          }}>
            <StatPill icon="🔐" label="Encryption" value="AES-256" delay=".5s" />
            <StatPill icon="🧹" label="Unlearning" value="SISA" delay=".55s" />
            <StatPill icon="🌿" label="Audit Trail" value="Merkle" delay=".6s" />
            <StatPill icon="🛡️" label="Privacy" value="GDPR Ready" delay=".65s" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding:'80px 48px', maxWidth:1080, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p className="section-label" style={{ justifyContent:'center', display:'flex' }}>Platform Features</p>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,40px)', fontWeight:700, letterSpacing:'-1px', marginTop:8 }}>
            Built for the Privacy-First Era
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
          <FeatureCard icon="🔒" title="Zero-Persistence RAG" color="#7c3aed"
            desc="FAISS embeddings encrypted with a per-session AES-256 key. Key and data wiped immediately after each answer."
            delay=".0s" />
          <FeatureCard icon="🧠" title="SISA Unlearning" color="#a855f7"
            desc="Sharded model weights. Forget any user in seconds — retrain only the affected shard, not the full model."
            delay=".1s" />
          <FeatureCard icon="🌿" title="Merkle Audit Trail" color="#06d6a0"
            desc="Every session event hashed into an append-only Merkle tree with RFC 3161 timestamps. Tamper-proof proof."
            delay=".2s" />
          <FeatureCard icon="🌫️" title="Differential Privacy" color="#ec4899"
            desc="Calibrated Laplace/Gaussian noise injected at the embedding layer so no individual's data can be inferred."
            delay=".3s" />
          <FeatureCard icon="🗂️" title="Forget Chat" color="#3b82f6"
            desc="Wipe your entire conversation history in one click. Cryptographic proof issued to your audit log instantly."
            delay=".4s" />
          <FeatureCard icon="⚖️" title="Compliance Ready" color="#f59e0b"
            desc="Mapped to GDPR, EU AI Act Art. 10/17, and India DPDP Section 8. Export proof JSON for regulators."
            delay=".5s" />
        </div>
      </section>

      {/* CTA FOOTER */}
      <section style={{
        textAlign:'center', padding:'60px 24px',
        borderTop:'1px solid var(--border)',
      }}>
        <h2 style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.5px', marginBottom:12 }}>
          Ready to protect your users' memory?
        </h2>
        <p style={{ color:'var(--text2)', marginBottom:28 }}>
          Sign up in seconds. No credit card required.
        </p>
        <button className="btn btn-primary" style={{ padding:'13px 36px', fontSize:15 }}
          onClick={() => navigate('/register')}>
          Create Free Account
        </button>
        <p style={{ marginTop:16, fontSize:12, color:'var(--text3)' }}>
          Already have an account?{' '}
          <span style={{ color:'var(--accent2)', cursor:'pointer' }} onClick={() => navigate('/login')}>
            Sign in
          </span>
        </p>
      </section>
    </div>
  );
}
