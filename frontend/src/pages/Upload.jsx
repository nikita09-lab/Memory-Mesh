/**
 * Upload.jsx — Upload documents to use as RAG context.
 * Supports .txt, .md, and .pdf files.
 */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function FileIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1H5a1 1 0 000 2h14a1 1 0 000-2h-2z"/>
    </svg>
  );
}

export default function Upload() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [clearing,  setClearing]  = useState(false);
  const [flash,     setFlash]     = useState(null);
  const [dragOver,  setDragOver]  = useState(false);
  const inputRef = useRef(null);

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const showFlash = (msg, type = 'ok') => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 4000);
  };

  const loadDocuments = () => {
    axios.get(`${API}/documents`, { headers: authHeaders() })
      .then(res => setDocuments(res.data.documents || []))
      .catch(() => {});
  };

  useEffect(() => { loadDocuments(); }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'md', 'pdf'].includes(ext)) {
      showFlash('Only .txt, .md, and .pdf files are supported.', 'err');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/documents`, formData, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      showFlash(`"${res.data.filename}" uploaded — ${res.data.chars.toLocaleString()} characters indexed.`);
      loadDocuments();
    } catch (err) {
      showFlash(err.response?.data?.detail || 'Upload failed.', 'err');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Delete all uploaded documents?')) return;
    setClearing(true);
    try {
      await axios.delete(`${API}/documents`, { headers: authHeaders() });
      setDocuments([]);
      showFlash('All documents cleared. AI will use default context.');
    } catch {
      showFlash('Failed to clear documents.', 'err');
    } finally { setClearing(false); }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 24px' }}>

        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Upload Documents</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
            Upload files for the AI to read and answer from. Supports .txt, .md, and .pdf.
          </p>
        </div>

        {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}

        {/* Drop zone */}
        <SpotlightCard
          spotlightColor="rgba(124,58,237,.15)"
          style={{ padding: 32, marginBottom: 24 }}
          className="fade-up"
        >
          {/* The actual file input — visible label makes it clickable everywhere */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent2)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: '32px 20px',
              textAlign: 'center',
              transition: 'border-color .2s',
              background: dragOver ? 'rgba(124,58,237,.06)' : 'transparent',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12, opacity: .4 }}>📄</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
              {uploading ? 'Uploading…' : 'Drag & drop a file here'}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 20 }}>
              .txt · .md · .pdf — max 50,000 characters
            </div>

            {/* This label + hidden input is the most reliable cross-browser file picker */}
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
              color: '#fff', borderRadius: 10, fontWeight: 600, fontSize: 13,
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1,
              boxShadow: '0 0 16px rgba(124,58,237,.4)',
            }}>
              📂 Browse files
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.md,.pdf"
                disabled={uploading}
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    uploadFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </SpotlightCard>

        {/* Document list */}
        {documents.length > 0 && (
          <SpotlightCard spotlightColor="rgba(124,58,237,.1)" style={{ padding: 24 }} className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="section-label" style={{ margin: 0 }}>
                Indexed Documents ({documents.length})
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={clearAll}
                disabled={clearing}
                style={{ color: '#fca5a5', borderColor: 'rgba(239,68,68,.25)', gap: 6 }}
              >
                <TrashIcon /> {clearing ? 'Clearing…' : 'Clear All'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, fontSize: 13,
                }}>
                  <span style={{ color: 'var(--accent2)', flexShrink: 0 }}><FileIcon /></span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.filename}
                  </span>
                  <span style={{ color: 'var(--text3)', fontSize: 11, flexShrink: 0, fontFamily: 'var(--mono)' }}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--teal2)', border: '1px solid rgba(6,214,160,.2)', borderRadius: 10, fontSize: 12, color: 'var(--teal)' }}>
              ✓ The AI will use these {documents.length} document{documents.length > 1 ? 's' : ''} to answer your queries.
            </div>
          </SpotlightCard>
        )}

        {documents.length === 0 && !uploading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)', fontSize: 13 }}>
            No documents uploaded yet. The AI uses built-in demo context until you upload something.
          </div>
        )}

      </div>
    </div>
  );
}