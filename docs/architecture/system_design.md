# MemoryMesh — System Design

## Overview

MemoryMesh is a privacy-preserving AI memory backend that combines four security layers:

1. **Secure In-Memory RAG** — AES-256-GCM encrypted FAISS vector store; no disk writes
2. **Machine Unlearning (SISA)** — selective shard retraining on user forget requests
3. **Merkle Audit Trail** — append-only SQLite + cryptographic deletion proofs
4. **Compliance API** — GDPR / EU AI Act / India DPDP transparency endpoints

---

## Component Map

```
Client (React + Vite)
        │  HTTPS / JWT Bearer
        ▼
FastAPI (main.py)
   ├── /login  /register  /me         → auth.py (bcrypt, JWT)
   ├── /query                          → rag_core/rag_core.py (RAGSession)
   ├── /forget                         → unlearning/sisa_unlearn.py (SISAUnlearnEngine)
   ├── /audit-proof                    → audit/audit_api.py → verifier.py
   ├── /chat-history (GET / DELETE)   → auth.py (in-memory store)
   ├── /users  /users/{u}  /stats     → auth.py + audit
   └── shared/
       ├── config.py   (env-based settings)
       ├── logger.py   (JSON structured logging)
       └── utils.py    (validation, ID generation)
```

---

## RAG Session Lifecycle

```
User query
    │
    ▼ EmbeddingEngine (sentence-transformers all-MiniLM-L6-v2 or CI stub)
    │ raw float32 vector
    ▼ DifferentialPrivacyLayer (Gaussian noise, ε=1.0, δ=1e-5)
    │ noisy vector
    ▼ SessionVault — AES-256-GCM encrypt → store ciphertext in FAISS RAM index
    │                (plaintext zeroed immediately after encrypt)
    │ on query: decrypt in RAM → search → zero plaintext buffer
    ▼ Llama3Generator (HuggingFace pipeline or stub in CI)
    │
    ▼ answer string
    + secure_wipe() called on every buffer
    + session key destroyed
```

---

## SISA Unlearning Flow

```
/forget?user_id=X
    │
    ▼ Identify which shards trained on user X's data
    ▼ Extract remaining dataset (exclude X's indices)
    ▼ Retrain only the affected shard(s) — N-1 shards unchanged
    ▼ Re-aggregate shard weights
    ▼ Log AuditEvent(event_type="user_deleted") → Merkle tree + SQLite
    ▼ Return accuracy delta (before vs. after)
```

---

## Data Storage

| Store | What | Persistence |
|-------|------|------------|
| RAM dict (`users_db`) | User accounts + hashed passwords | Lost on restart — replace with SQLite/Postgres in prod |
| RAM dict (`chat_history_db`) | Chat messages | Lost on restart |
| FAISS index | Encrypted embedding vectors | In-memory only, wiped per session |
| SQLite (`audit.db`) | Audit event log | Persistent, append-only |

> **Production note:** `users_db` and `chat_history_db` must be migrated to a persistent database (PostgreSQL recommended) before production deployment.

---

## Authentication Flow

```
POST /login  {username, password}   ← JSON body, never query params
    │
    ▼ bcrypt.verify(password, stored_hash)
    ▼ jwt.encode({sub: username, exp: now+60min}, SECRET_KEY)
    │
    ▼ Client stores token in localStorage
    │
All protected requests:
    Authorization: Bearer <token>
    │
    ▼ get_current_user() → jwt.decode() → username
    ▼ admin_required() → check role=="admin" for sensitive endpoints
```
