"""
auth.py — Authentication & user management for MemoryMesh.
Uses PostgreSQL (Supabase) for persistent storage.
"""
import os
from datetime import datetime, timedelta

import psycopg2
import psycopg2.extras
from jose import JWTError, jwt
from passlib.context import CryptContext

from shared.config import settings
from shared.utils import (
    utc_now_iso,
    validate_email,
    validate_password,
    validate_username,
)

_admin_password = os.getenv("ADMIN_PASSWORD", "")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Database connection ───────────────────────────────────────────────────────

def _get_conn():
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = False
    return conn


def _init_db() -> None:
    """Create tables if they don't exist and seed the admin account."""
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    username        TEXT PRIMARY KEY,
                    hashed_password TEXT NOT NULL,
                    role            TEXT NOT NULL DEFAULT 'user',
                    email           TEXT NOT NULL DEFAULT ''
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_history (
                    id        SERIAL PRIMARY KEY,
                    username  TEXT NOT NULL,
                    role      TEXT NOT NULL,
                    content   TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                );
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_chat_username
                    ON chat_history (username);
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id         SERIAL PRIMARY KEY,
                    username   TEXT NOT NULL,
                    filename   TEXT NOT NULL,
                    content    TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
                );
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_docs_username
                    ON documents (username);
            """)

            # Seed admin only if not exists
            cur.execute("SELECT 1 FROM users WHERE username = 'admin'")
            if not cur.fetchone():
                hashed = pwd_context.hash(_admin_password)
                cur.execute(
                    "INSERT INTO users (username, hashed_password, role, email) VALUES (%s, %s, %s, %s)",
                    ("admin", hashed, "admin", "admin@memorymesh.ai"),
                )
        conn.commit()


# Run once at import time
_init_db()


# ── User management ───────────────────────────────────────────────────────────

def get_all_users() -> list[dict]:
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT username, role, email FROM users")
            return [dict(r) for r in cur.fetchall()]


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
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                return None, "Username already exists."
            hashed = pwd_context.hash(password)
            cur.execute(
                "INSERT INTO users (username, hashed_password, role, email) VALUES (%s, %s, %s, %s)",
                (username, hashed, "user", email),
            )
        conn.commit()

    return {"username": username, "role": "user", "email": email}, None


def delete_user_permanently(username: str) -> tuple[bool, str]:
    if username == "admin":
        return False, "Cannot delete the admin account."
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM chat_history WHERE username = %s", (username,))
            cur.execute("DELETE FROM documents WHERE username = %s", (username,))
            cur.execute("DELETE FROM users WHERE username = %s", (username,))
            deleted = cur.rowcount
        conn.commit()
    if deleted == 0:
        return False, "User not found."
    return True, "User deleted."


def authenticate_user(username: str, password: str) -> dict | None:
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            row = cur.fetchone()

    if not row:
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
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_history (username, role, content, timestamp) VALUES (%s, %s, %s, %s)",
                (username, role, content, utc_now_iso()),
            )
        conn.commit()


def get_chat_history(username: str) -> list[dict]:
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT role, content, timestamp FROM chat_history WHERE username = %s ORDER BY id",
                (username,),
            )
            return [dict(r) for r in cur.fetchall()]


def delete_chat_history(username: str) -> int:
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM chat_history WHERE username = %s", (username,))
            count = cur.rowcount
        conn.commit()
    return count


# ── Document storage ──────────────────────────────────────────────────────────

def save_document(username: str, filename: str, content: str) -> int:
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO documents (username, filename, content) VALUES (%s, %s, %s) RETURNING id",
                (username, filename, content),
            )
            doc_id = cur.fetchone()[0]
        conn.commit()
    return doc_id


def get_documents(username: str) -> list[dict]:
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, filename, content, created_at FROM documents WHERE username = %s ORDER BY id DESC",
                (username,),
            )
            return [dict(r) for r in cur.fetchall()]


def delete_documents(username: str) -> int:
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM documents WHERE username = %s", (username,))
            count = cur.rowcount
        conn.commit()
    return count


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