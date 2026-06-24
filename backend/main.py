from contextlib import asynccontextmanager
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from torch.utils.data import DataLoader, Subset
from pydantic import BaseModel

from audit.audit_api import router as audit_router
from audit.audit_api import logger
from audit.merkle_log import AuditEvent

from rag_core.rag_core import RAGSession

from unlearning.sisa_unlearn import (
    SISAUnlearnEngine,
    SISAConfig,
    _make_demo_dataset,
)
from auth import (
    authenticate_user,
    create_access_token,
    register_user,
    delete_user_permanently,
    get_all_users,
    save_chat_message,
    get_chat_history,
    delete_chat_history,
    users_db,
)
from auth_dependency import get_current_user

# --------------------------------------------------
# Global Objects
# --------------------------------------------------

engine = None
cfg = None
train_ds = None
test_ds = None
test_loader = None
user_map = None


# --------------------------------------------------
# Startup
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine, cfg, train_ds, test_ds, test_loader, user_map

    print("Starting MemoryMesh...")
    cfg = SISAConfig()
    engine = SISAUnlearnEngine(cfg)
    train_ds, user_map = _make_demo_dataset(400, cfg)
    test_ds, _ = _make_demo_dataset(100, cfg)
    test_loader = DataLoader(test_ds, batch_size=32)
    print("Training SISA engine...")
    engine.train_all(train_ds, user_map)
    print("MemoryMesh Ready")
    yield
    print("Shutting down MemoryMesh...")


# --------------------------------------------------
# App
# --------------------------------------------------

app = FastAPI(title="MemoryMesh API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audit_router)


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():
    return {"message": "MemoryMesh Backend Running"}


# --------------------------------------------------
# Auth endpoints
# --------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str = ""

@app.post("/login")
def login(username: str, password: str):
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": username})
    return {"access_token": token, "token_type": "bearer", "username": username, "role": user["role"]}

@app.post("/register")
def register(req: RegisterRequest):
    user, err = register_user(req.username, req.password, req.email)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return {"message": "User registered successfully", "username": user["username"]}

@app.get("/users")
def list_users(current_user: str = Depends(get_current_user)):
    return {"users": get_all_users()}

@app.delete("/users/{username}")
def delete_user(username: str, current_user: str = Depends(get_current_user)):
    ok, msg = delete_user_permanently(username)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    # Log to audit trail
    event = AuditEvent(
        event_id=str(uuid.uuid4()),
        user_id=username,
        session_id="admin-delete",
        event_type="user_permanently_deleted",
        timestamp=datetime.utcnow().isoformat(),
    )
    logger.log_event(event)
    return {"message": msg, "username": username}

@app.get("/me")
def me(current_user: str = Depends(get_current_user)):
    from auth import users_db
    u = users_db.get(current_user, {})
    return {"username": current_user, "role": u.get("role","user"), "email": u.get("email","")}


# --------------------------------------------------
# Query + Chat history
# --------------------------------------------------

@app.post("/query")
def query(question: str, current_user: str = Depends(get_current_user)):
    docs = [
        "MemoryMesh is a privacy preserving AI memory system.",
        "User data is encrypted using AES-256.",
        "Machine unlearning is implemented using SISA.",
        "Differential privacy noise is injected at the embedding layer.",
        "All session keys are wiped immediately after the answer is returned.",
        "The Merkle audit trail provides cryptographic proof of data deletion.",
    ]
    with RAGSession() as session:
        session.index(docs)
        answer = session.query(question)

    save_chat_message(current_user, "user", question)
    save_chat_message(current_user, "assistant", answer)

    return {"question": question, "answer": answer}

@app.get("/chat-history")
def chat_history(current_user: str = Depends(get_current_user)):
    return {"messages": get_chat_history(current_user)}

@app.delete("/chat-history")
def clear_chat(current_user: str = Depends(get_current_user)):
    deleted = delete_chat_history(current_user)
    event = AuditEvent(
        event_id=str(uuid.uuid4()),
        user_id=current_user,
        session_id="chat-delete",
        event_type="chat_history_deleted",
        timestamp=datetime.utcnow().isoformat(),
    )
    logger.log_event(event)
    return {"message": f"Deleted {deleted} messages", "count": deleted}


# --------------------------------------------------
# Forget (SISA unlearning)
# --------------------------------------------------

@app.post("/forget")
def forget(user_id: str, current_user: str = Depends(get_current_user)):
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
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        session_id="forget-session",
        event_type="user_deleted",
        timestamp=datetime.utcnow().isoformat(),
    )
    logger.log_event(event)
    return result


# --------------------------------------------------
# Stats
# --------------------------------------------------

@app.get("/stats")
def get_stats(current_user: str = Depends(get_current_user)):
    total_users = len(users_db)
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
