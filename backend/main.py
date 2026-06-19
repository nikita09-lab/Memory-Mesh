from contextlib import asynccontextmanager
from datetime import datetime
import uuid

from fastapi import FastAPI
from torch.utils.data import DataLoader, Subset

from audit.audit_api import router as audit_router
from audit.audit_api import logger
from audit.merkle_log import AuditEvent

from rag_core.rag_core import RAGSession

from unlearning.sisa_unlearn import (
    SISAUnlearnEngine,
    SISAConfig,
    _make_demo_dataset
)
from auth import (
    authenticate_user,
    create_access_token
)

from fastapi import HTTPException   
from fastapi import Depends
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
# Startup Lifecycle
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):

    global engine
    global cfg
    global train_ds
    global test_ds
    global test_loader
    global user_map

    print("Starting MemoryMesh...")

    cfg = SISAConfig()

    engine = SISAUnlearnEngine(cfg)

    train_ds, user_map = _make_demo_dataset(
        400,
        cfg
    )

    test_ds, _ = _make_demo_dataset(
        100,
        cfg
    )

    test_loader = DataLoader(
        test_ds,
        batch_size=32
    )

    print("Training SISA engine...")

    engine.train_all(
        train_ds,
        user_map
    )

    print("MemoryMesh Ready")

    yield

    print("Shutting down MemoryMesh...")


# --------------------------------------------------
# FastAPI App
# --------------------------------------------------

app = FastAPI(
    title="MemoryMesh API",
    lifespan=lifespan
)

app.include_router(audit_router)


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "MemoryMesh Backend Running"
    }


# --------------------------------------------------
# Login API
# --------------------------------------------------

@app.post("/login")
def login(
    username: str,
    password: str
):

    user = authenticate_user(
        username,
        password
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        {
            "sub": username
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# --------------------------------------------------
# Query API
# --------------------------------------------------

@app.post("/query")
def query(
    question: str,
    current_user: str = Depends(
        get_current_user
    )
):
    docs = [
        "MemoryMesh is a privacy preserving AI memory system.",
        "User data is encrypted using AES-256.",
        "Machine unlearning is implemented using SISA."
    ]

    with RAGSession() as session:

        session.index(docs)

        answer = session.query(question)

    return {
        "question": question,
        "answer": answer
    }


# --------------------------------------------------
# Forget API
# --------------------------------------------------
@app.post("/forget")
def forget(
    user_id: str,
    current_user: str = Depends(
        get_current_user
    )
):

    if user_id not in user_map:

        return {
            "status": "user_not_found",
            "user_id": user_id
        }

    user_indices = user_map[user_id]

    remaining_indices = [

        i
        for i in range(len(train_ds))

        if i not in user_indices
    ]

    retrain_ds = Subset(
        train_ds,
        remaining_indices
    )

    result = engine.forget(
        user_id=user_id,
        retrain_dataset=retrain_ds,
        test_loader=test_loader
    )

    event = AuditEvent(
        event_id=str(uuid.uuid4()),
        user_id=user_id,
        session_id="forget-session",
        event_type="user_deleted",
        timestamp=datetime.utcnow().isoformat()
    )

    logger.log_event(event)

    return result
