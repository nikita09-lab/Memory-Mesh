"""
auth.py — Authentication & user management for MemoryMesh.
Users and chat history are now persisted to SQLite so they survive restarts.
"""
import os
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from jose import jwt, JWTError
from passlib.context import CryptContext

from shared.config import settings
from shared.utils import validate_username, validate_password, validate_email, utc_now_iso
_admin_password = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Database setup ────────────────────────────────────────────────────────────

DB_PATH = Path(settings.DB_PATH).parent / "memorymesh_users.db"


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    """Create tables if they don't exist and seed the admin account."""
    with _get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                username        TEXT PRIMARY KEY,
                hashed_password TEXT NOT NULL,
                role            TEXT NOT NULL DEFAULT 'user',
                email           TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS chat_history (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                username  TEXT NOT NULL,
                role      TEXT NOT NULL,
                content   TEXT NOT NULL,
                timestamp TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_chat_username
                ON chat_history (username);
                
            CREATE TABLE IF NOT EXISTS documents (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT NOT NULL,
                filename   TEXT NOT NULL,
                content    TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_docs_username
                ON documents (username);
        """)

        # Seed admin only if it doesn't exist yet
        existing = conn.execute(
            "SELECT 1 FROM users WHERE username = 'admin'"
        ).fetchone()

        if not existing:
            hashed = pwd_context.hash(_admin_password)
            conn.execute(
                "INSERT INTO users (username, hashed_password, role, email) VALUES (?, ?, ?, ?)",
                ("admin", hashed, "admin", "admin@memorymesh.ai"),
            )
            conn.commit()


# Run once at import time
_init_db()


# ── User management ───────────────────────────────────────────────────────────

def get_all_users() -> list[dict]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT username, role, email FROM users"
        ).fetchall()
    return [dict(r) for r in rows]


def register_user(username: str, password: str, email: str = "") -> tuple[dict | None, str | None]:
    err = validate_username(username)
    if err:
        return None, err
    err = validate_password(password)
    if err:
        return None, err
    err = validate_email(email)
    if err:
        return None, err

    with _get_conn() as conn:
        existing = conn.execute(
            "SELECT 1 FROM users WHERE username = ?", (username,)
        ).fetchone()
        if existing:
            return None, "Username already exists."

        hashed = pwd_context.hash(password)
        conn.execute(
            "INSERT INTO users (username, hashed_password, role, email) VALUES (?, ?, ?, ?)",
            (username, hashed, "user", email),
        )
        conn.commit()

    return {"username": username, "role": "user", "email": email}, None


def delete_user_permanently(username: str) -> tuple[bool, str]:
    if username == "admin":
        return False, "Cannot delete the admin account."
    with _get_conn() as conn:
        result = conn.execute(
            "DELETE FROM users WHERE username = ?", (username,)
        )
        conn.commit()
        if result.rowcount == 0:
            return False, "User not found."
        # Wipe chat history too
        conn.execute(
            "DELETE FROM chat_history WHERE username = ?", (username,)
        )
        conn.commit()
    return True, "User deleted."


def authenticate_user(username: str, password: str) -> dict | None:
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()

    if not row:
        # Constant-time dummy verify to prevent user-enumeration via timing
        pwd_context.verify(
            "dummy",
            "$2b$12$KIXkbHxVFBJB3cMd7H3oDeHoR7RmFLRjWEt7sRq2JoLVN0M0l0Hma",
        )
        return None

    if not pwd_context.verify(password, row["hashed_password"]):
        return None

    return dict(row)


# ── Chat history ──────────────────────────────────────────────────────────────

def save_chat_message(username: str, role: str, content: str) -> None:
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO chat_history (username, role, content, timestamp) VALUES (?, ?, ?, ?)",
            (username, role, content, utc_now_iso()),
        )
        conn.commit()


def get_chat_history(username: str) -> list[dict]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT role, content, timestamp FROM chat_history WHERE username = ? ORDER BY id",
            (username,),
        ).fetchall()
    return [dict(r) for r in rows]


def delete_chat_history(username: str) -> int:
    with _get_conn() as conn:
        result = conn.execute(
            "DELETE FROM chat_history WHERE username = ?", (username,)
        )
        conn.commit()
    return result.rowcount


# ── Document storage ──────────────────────────────────────────────────────────

def save_document(username: str, filename: str, content: str) -> int:
    with _get_conn() as conn:
        cursor = conn.execute(
            "INSERT INTO documents (username, filename, content) VALUES (?, ?, ?)",
            (username, filename, content),
        )
        conn.commit()
        return cursor.lastrowid

def get_documents(username: str) -> list[dict]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT id, filename, content, created_at FROM documents WHERE username = ? ORDER BY id DESC",
            (username,),
        ).fetchall()
    return [dict(r) for r in rows]

def delete_documents(username: str) -> int:
    with _get_conn() as conn:
        result = conn.execute(
            "DELETE FROM documents WHERE username = ?", (username,)
        )
        conn.commit()
    return result.rowcount


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str | None = payload.get("sub")
        return username or None
    except JWTError:
        return None