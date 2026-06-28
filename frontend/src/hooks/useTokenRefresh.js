/**
 * useTokenRefresh.js
 *
 * Automatically refreshes the JWT token 5 minutes before it expires.
 * Drop this hook into any top-level component (e.g. App.jsx) and it
 * silently keeps the session alive without the user needing to re-login.
 *
 * Usage:
 *   import useTokenRefresh from './hooks/useTokenRefresh';
 *   // inside App() or any always-mounted component:
 *   useTokenRefresh();
 */
import { useEffect, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Decode the JWT payload without verifying the signature.
 * We only need the `exp` field to know when it expires.
 */
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // convert to milliseconds
  } catch {
    return null;
  }
}

export default function useTokenRefresh() {
  const timerRef = useRef(null);

  const scheduleRefresh = (token) => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const now       = Date.now();
    const expiresIn = expiry - now;                  // ms until expiry
    const refreshIn = expiresIn - 5 * 60 * 1000;    // refresh 5 min before expiry

    if (refreshIn <= 0) {
      // Token already expired or about to — refresh immediately
      doRefresh();
      return;
    }

    timerRef.current = setTimeout(doRefresh, refreshIn);
  };

  const doRefresh = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.post(
        `${API}/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const newToken = res.data.access_token;
      localStorage.setItem('token', newToken);

      // Schedule the next refresh for the new token
      scheduleRefresh(newToken);
    } catch {
      // Refresh failed — token is invalid, log the user out
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) scheduleRefresh(token);

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}