# MemoryMesh — Threat Model

## Assets

| Asset | Sensitivity |
|-------|------------|
| User passwords | Critical |
| JWT secret key | Critical |
| Chat history | High |
| Embedding vectors | High |
| Audit log | Medium |
| User list | Medium |

---

## Threat Scenarios

### T1 — Credential theft via server logs (MITIGATED)
**Original risk:** `/login` sent username + password as query params → logged by uvicorn, nginx, load balancers.  
**Mitigation:** Login now uses a JSON POST body. Passwords never appear in URLs.

### T2 — Hardcoded JWT secret (MITIGATED)
**Original risk:** `SECRET_KEY = "memorymesh-secret-key-2025"` was in source code. Any attacker could forge tokens for any user.  
**Mitigation:** `SECRET_KEY` loaded from env var; validated at startup; randomly generated in dev if missing.

### T3 — Plaintext password storage (MITIGATED)
**Original risk:** Passwords stored and compared in plaintext. A DB dump = all credentials exposed.  
**Mitigation:** bcrypt hashing via passlib. Verification uses constant-time comparison.

### T4 — Privilege escalation (MITIGATED)
**Original risk:** Any authenticated user could list all users, delete any user, and trigger unlearning for any user_id.  
**Mitigation:** `admin_required` dependency added to `/users` and `/users/{u}`. `/forget` checks `current_user == user_id OR role == admin`.

### T5 — Brute-force login
**Mitigation:** `slowapi` rate limiter — 10 requests/minute per IP on `/login`. Failed logins logged.

### T6 — Token not validated client-side
**Original risk:** `ProtectedRoute` only checked if `localStorage.token` was non-empty. An expired or forged token could access protected pages.  
**Mitigation:** `ProtectedRoute` now calls `GET /me` with the token; on 401, clears storage and redirects to `/login`.

### T7 — Secrets committed to git
**Original risk:** `rag_core.py.save`, `provenance.json`, `benchmark_report.csv` were committed.  
**Mitigation:** Added to `.gitignore`; removed from tracking with `git rm --cached`.

### T8 — XSS token theft
**Residual risk:** Token stored in `localStorage` is accessible to JavaScript — XSS can steal it.  
**Recommended mitigation:** Move to `httpOnly` cookie with `SameSite=Strict`. This requires a cookie-based auth flow change in both backend and frontend.

### T9 — In-memory user store
**Residual risk:** `users_db` is a Python dict — all accounts wiped on restart.  
**Recommended mitigation:** Migrate to PostgreSQL with SQLAlchemy.

### T10 — Audit DB path is relative
**Residual risk:** `audit.db` lands wherever uvicorn starts from.  
**Mitigation:** `DB_PATH` now read from env var (default `./audit.db`). Set to an absolute path in production.

---

## Out of Scope

- Physical server access
- Supply-chain attacks on PyPI packages
- Side-channel attacks on bcrypt
