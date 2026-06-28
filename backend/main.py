"""
main.py — MemoryMesh FastAPI application entry point.

Security changes vs. original:
  - /login accepts JSON body (not query params — passwords were leaking into logs)
  - Admin-only endpoints protected with admin_required dependency
  - /forget restricted to own data or admin
  - Input length validation on /query
  - SECRET_KEY from env via shared.config
  - Rate limiting on /login (requires slowapi: pip install slowapi)
  - CORS origins from config (not hardcoded)
"""

# load_dotenv MUST be first — before any import that reads env vars
from dotenv import load_dotenv  # noqa: E402

load_dotenv()

import io  # noqa: E402
from contextlib import asynccontextmanager  # noqa: E402

import pypdf  # noqa: E402
from fastapi import (  # noqa: E402
    Depends,
    FastAPI,
    File,
    HTTPException,
    Request,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from torch.utils.data import DataLoader, Subset  # noqa: E402

from audit.audit_api import logger  # noqa: E402
from audit.audit_api import router as audit_router  # noqa: E402
from audit.merkle_log import AuditEvent  # noqa: E402
from auth import (  # noqa: E402
    authenticate_user,
    create_access_token,
    delete_chat_history,
    delete_documents,
    delete_user_permanently,
    get_all_users,
    get_chat_history,
    get_documents,
    register_user,
    save_chat_message,
    save_document,
)
from auth_dependency import get_current_user  # noqa: E402
from rag_core.rag_core import RAGSession  # noqa: E402
from shared.config import settings  # noqa: E402
from shared.logger import get_logger  # noqa: E402
from shared.utils import new_event_id, truncate, utc_now_iso  # noqa: E402
from unlearning.sisa_unlearn import (  # noqa: E402
    SISAConfig,
    SISAUnlearnEngine,
    _make_demo_dataset,
)

log = get_logger("memorymesh.main")

# Optional rate limiting — graceful fallback if slowapi not installed
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.util import get_remote_address

    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMITING = True
except ImportError:
    limiter = None
    RATE_LIMITING = False
    log.warning(
        "slowapi not installed — login rate limiting disabled. Run: pip install slowapi"
    )

# --------------------------------------------------
# Global ML objects
# --------------------------------------------------
engine = None
cfg = None
train_ds = None
test_ds = None
test_loader = None
user_map = None


# --------------------------------------------------
# Startup / Shutdown
# --------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, cfg, train_ds, test_ds, test_loader, user_map

    settings.validate()  # fail fast on missing SECRET_KEY in production

    log.info("Starting MemoryMesh...")
    cfg = SISAConfig()
    engine = SISAUnlearnEngine(cfg)
    train_ds, user_map = _make_demo_dataset(400, cfg)
    test_ds, _ = _make_demo_dataset(100, cfg)
    test_loader = DataLoader(test_ds, batch_size=32)
    log.info("Training SISA engine...")
    engine.train_all(train_ds, user_map)
    log.info("MemoryMesh Ready")
    yield
    log.info("Shutting down MemoryMesh...")


# --------------------------------------------------
# App
# --------------------------------------------------

app = FastAPI(title="MemoryMesh API", version="2.0.0", lifespan=lifespan)

if RATE_LIMITING:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit_router)


# --------------------------------------------------
# Dependencies
# --------------------------------------------------


def admin_required(current_user: str = Depends(get_current_user)) -> str:
    """FastAPI dependency: raises 403 unless the current user has role=admin."""
    u_list = [x for x in get_all_users() if x["username"] == current_user]
    user = u_list[0] if u_list else {}
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return current_user


# --------------------------------------------------
# Home
# --------------------------------------------------


@app.get("/")
def home():
    return {"message": "MemoryMesh Backend Running", "version": "2.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# --------------------------------------------------
# Auth endpoints
# --------------------------------------------------


class LoginRequest(BaseModel):
    """Credentials must be in the request body — never in query params."""

    username: str = Field(..., min_length=1, max_length=64)
    password: str = Field(..., min_length=1, max_length=256)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=8, max_length=256)
    email: str = Field(default="", max_length=320)


if RATE_LIMITING:

    @app.post("/login")
    @limiter.limit("10/minute")
    async def login(req: LoginRequest, request: Request):
        user = authenticate_user(req.username, req.password)
        if not user:
            log.warning("Failed login attempt", extra={"username": req.username})
            raise HTTPException(status_code=401, detail="Invalid credentials.")
        token = create_access_token({"sub": req.username})
        log.info("User logged in", extra={"username": req.username})
        return {
            "access_token": token,
            "token_type": "bearer",
            "username": req.username,
            "role": user["role"],
        }

else:

    @app.post("/login")
    async def login(req: LoginRequest, request: Request):  # type: ignore[misc]
        user = authenticate_user(req.username, req.password)
        if not user:
            log.warning("Failed login attempt", extra={"username": req.username})
            raise HTTPException(status_code=401, detail="Invalid credentials.")
        token = create_access_token({"sub": req.username})
        log.info("User logged in", extra={"username": req.username})
        return {
            "access_token": token,
            "token_type": "bearer",
            "username": req.username,
            "role": user["role"],
        }


@app.post("/register")
def register(req: RegisterRequest):
    user, err = register_user(req.username, req.password, req.email)
    if err:
        raise HTTPException(status_code=400, detail=err)
    log.info("New user registered", extra={"username": user["username"]})
    return {"message": "User registered successfully.", "username": user["username"]}


@app.get("/users")
def list_users(admin: str = Depends(admin_required)):
    """Admin only — was accessible by any authenticated user."""
    return {"users": get_all_users()}


@app.delete("/users/{username}")
def delete_user(username: str, admin: str = Depends(admin_required)):
    """Admin only — was accessible by any authenticated user."""
    ok, msg = delete_user_permanently(username)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    event = AuditEvent(
        event_id=new_event_id(),
        user_id=username,
        session_id="admin-delete",
        event_type="user_permanently_deleted",
        timestamp=utc_now_iso(),
    )
    logger.log_event(event)
    log.info("User deleted by admin", extra={"target": username, "admin": admin})
    return {"message": msg, "username": username}


@app.get("/me")
def me(current_user: str = Depends(get_current_user)):
    u = next((x for x in get_all_users() if x["username"] == current_user), {})
    return {
        "username": current_user,
        "role": u.get("role", "user"),
        "email": u.get("email", ""),
    }


@app.post("/refresh")
def refresh(current_user: str = Depends(get_current_user)):
    """Issue a fresh token for an already-authenticated user."""
    u = next((x for x in get_all_users() if x["username"] == current_user), {})
    token = create_access_token({"sub": current_user})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": current_user,
        "role": u.get("role", "user"),
    }


# --------------------------------------------------
# Query + Chat history
# --------------------------------------------------


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


@app.post("/query")
def query(req: QueryRequest, current_user: str = Depends(get_current_user)):
    user_docs = get_documents(current_user)
    if user_docs:
        docs = [d["content"] for d in user_docs]
    else:
        docs = [
            "MemoryMesh is a privacy preserving AI memory system.",
            "User data is encrypted using AES-256.",
            "Machine unlearning is implemented using SISA.",
            "Differential privacy noise is injected at the embedding layer.",
            "All session keys are wiped immediately after the answer is returned.",
            "The Merkle audit trail provides cryptographic proof of data deletion.",
        ]
    question = truncate(req.question, max_len=2000)
    with RAGSession() as session:
        session.index(docs)
        answer = session.query(question)

    save_chat_message(current_user, "user", question)
    save_chat_message(current_user, "assistant", answer)
    return {"question": question, "answer": answer}


# --------------------------------------------------
# Document upload
# --------------------------------------------------


@app.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user),
):
    """Upload a TXT, MD, or PDF file to use as RAG context."""
    allowed = {".txt", ".md", ".pdf"}
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail="Only .txt, .md, and .pdf files are supported.",
        )

    MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10 MB.")

    if ext == ".pdf":
        reader = pypdf.PdfReader(io.BytesIO(raw))
        content = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        content = raw.decode("utf-8", errors="ignore")

    if not content.strip():
        raise HTTPException(status_code=400, detail="File appears to be empty or unreadable.")

    content = truncate(content, max_len=50000)
    doc_id = save_document(current_user, file.filename, content)
    log.info("Document uploaded", extra={"username": current_user, "doc_filename": file.filename})
    return {"id": doc_id, "filename": file.filename, "chars": len(content)}


@app.get("/documents")
def list_documents(current_user: str = Depends(get_current_user)):
    docs = get_documents(current_user)
    return {
        "documents": [
            {"id": d["id"], "filename": d["filename"], "created_at": d["created_at"]}
            for d in docs
        ]
    }


@app.delete("/documents")
def clear_documents(current_user: str = Depends(get_current_user)):
    deleted = delete_documents(current_user)
    return {"message": f"Deleted {deleted} documents.", "count": deleted}


@app.get("/chat-history")
def chat_history(current_user: str = Depends(get_current_user)):
    return {"messages": get_chat_history(current_user)}


@app.delete("/chat-history")
def clear_chat(current_user: str = Depends(get_current_user)):
    deleted = delete_chat_history(current_user)
    event = AuditEvent(
        event_id=new_event_id(),
        user_id=current_user,
        session_id="chat-delete",
        event_type="chat_history_deleted",
        timestamp=utc_now_iso(),
    )
    logger.log_event(event)
    return {"message": f"Deleted {deleted} messages.", "count": deleted}


# --------------------------------------------------
# Forget (SISA unlearning)
# --------------------------------------------------


@app.post("/forget")
def forget(user_id: str, current_user: str = Depends(get_current_user)):
    """Users can only forget their own data; admins can forget anyone's."""
    u_list = [x for x in get_all_users() if x["username"] == current_user]
    requesting_user = u_list[0] if u_list else {}
    is_admin = requesting_user.get("role") == "admin"
    if current_user != user_id and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You can only request forgetting of your own data.",
        )

    if user_id not in user_map:
        return {"status": "user_not_found", "user_id": user_id}

    user_indices = user_map[user_id]
    remaining_indices = [i for i in range(len(train_ds)) if i not in user_indices]
    retrain_ds = Subset(train_ds, remaining_indices)

    result = engine.forget(
        user_id=user_id,
        retrain_dataset=retrain_ds,
        test_loader=test_loader,
    )

    event = AuditEvent(
        event_id=new_event_id(),
        user_id=user_id,
        session_id="forget-session",
        event_type="user_deleted",
        timestamp=utc_now_iso(),
    )
    logger.log_event(event)
    log.info("SISA forget completed", extra={"user_id": user_id, "requested_by": current_user})
    return result


# --------------------------------------------------
# Stats
# --------------------------------------------------


@app.get("/stats")
def get_stats(current_user: str = Depends(get_current_user)):
    total_users = len(get_all_users())
    try:
        total_audit_events = len(logger.storage.get_events_by_user(current_user))
    except Exception:
        total_audit_events = 0

    return {
        "total_users": total_users,
        "protected_memories": len(train_ds),
        "forget_requests": total_audit_events,
        "audit_events": total_audit_events,
    }
