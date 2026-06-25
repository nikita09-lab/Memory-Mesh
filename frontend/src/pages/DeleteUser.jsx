import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';

const API = 'http://127.0.0.1:8000';

function UserIcon() { return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>; }
function TrashIcon(){ return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1H5a1 1 0 000 2h14a1 1 0 000-2h-2z"/></svg>; }
function RefreshIcon(){ return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>; }

export default function DeleteUser() {
  const [users,    setUsers]    = useState([]);
  const [confirm,  setConfirm]  = useState(null); // username
  const [flash,    setFlash]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [fetching, setFetching] = useState(false);
  const me = localStorage.getItem('mm_username');

  const loadUsers = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${API}/users`, { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } });
      setUsers(res.data.users || []);
    } catch { setFlash({ msg:'Could not load users.', type:'err' }); }
    finally { setFetching(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const doDelete = async (username) => {
    setLoading(true);
    try {
      await axios.delete(`${API}/users/${username}`, { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } });
      setFlash({ msg:`User "${username}" permanently deleted and logged to audit trail.`, type:'ok' });
      setConfirm(null);
      loadUsers();
    } catch (err) {
      setFlash({ msg: err.response?.data?.detail || 'Delete failed.', type:'err' });
    } finally { setLoading(false); setTimeout(()=>setFlash(null),4000); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar />
      <div style={{ maxWidth:760, margin:'0 auto', padding:'36px 24px' }}>

        <div className="fade-up" style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>Delete User</h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:4 }}>
            Permanently remove a user — this triggers SISA unlearning and logs to the Merkle audit trail.
          </p>
        </div>

        {flash && <div className={`flash flash-${flash.type}`}>{flash.msg}</div>}

        <SpotlightCard spotlightColor="rgba(239,68,68,.1)" style={{ padding:0, overflow:'hidden' }} className="fade-up">
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight:600, fontSize:14 }}>All Users</div>
            <button className="btn btn-ghost btn-sm" onClick={loadUsers} disabled={fetching}>
              <RefreshIcon />{fetching?'Loading…':'Refresh'}
            </button>
          </div>

          {users.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
              <div style={{ fontSize:28, marginBottom:8, opacity:.4 }}><UserIcon/></div>
              No users found
            </div>
          ) : (
            <div>
              {users.map((u, i) => (
                <div key={u.username} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'14px 20px',
                  borderBottom: i < users.length-1 ? '1px solid var(--border)' : 'none',
                  background: confirm === u.username ? 'rgba(239,68,68,.05)' : 'transparent',
                  transition:'background .2s',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:36, height:36, borderRadius:'50%',
                      background: u.role === 'admin' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, fontWeight:700, color:'#fff',
                    }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:500, color:'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
                        {u.username}
                        {u.username === me && <span className="badge badge-purple" style={{ fontSize:10 }}>You</span>}
                        {u.role === 'admin' && <span className="badge badge-amber" style={{ fontSize:10 }}>Admin</span>}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>{u.email || 'No email'}</div>
                    </div>
                  </div>

                  {u.role !== 'admin' ? (
                    confirm === u.username ? (
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'#fca5a5' }}>Permanently delete?</span>
                        <button className="btn btn-red btn-sm" onClick={()=>doDelete(u.username)} disabled={loading}>
                          <TrashIcon />{loading?'Deleting…':'Confirm Delete'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>setConfirm(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={()=>setConfirm(u.username)}
                        style={{ color:'#fca5a5', borderColor:'rgba(239,68,68,.25)' }}>
                        <TrashIcon /> Delete
                      </button>
                    )
                  ) : (
                    <span style={{ fontSize:11, color:'var(--text3)' }}>Protected</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}
