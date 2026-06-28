/**
 * ProtectedRoute.jsx
 *
 * FIXED: validates the token against the backend /me endpoint instead of
 * just checking whether localStorage has a non-empty string.
 * An expired or forged token now redirects to /login instead of rendering
 * protected content.
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function ProtectedRoute({ children }) {
  // 'checking' while we validate | 'ok' if valid | 'fail' if invalid/expired
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setStatus('fail');
      return;
    }
    axios
      .get(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => setStatus('ok'))
      .catch(() => {
        localStorage.clear(); // wipe stale / forged token
        setStatus('fail');
      });
  }, []);

  if (status === 'checking') {
    // Minimal loading indicator — replace with your spinner component if you have one
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text2)',
          fontSize: 13,
        }}
      >
        Verifying session…
      </div>
    );
  }

  if (status === 'fail') {
    return <Navigate to="/login" replace />;
  }

  return children;
}
