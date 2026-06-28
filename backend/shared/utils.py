"""
shared/utils.py — Utility helpers for MemoryMesh backend.
"""
import re
import uuid
from datetime import datetime, timezone


# ── Identifiers ───────────────────────────────────────────────────────────────

def new_event_id() -> str:
    """Return a new UUID4 string suitable for audit event IDs."""
    return str(uuid.uuid4())


def utc_now_iso() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(tz=timezone.utc).isoformat()


# ── Validation ────────────────────────────────────────────────────────────────

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_\-]{3,32}$")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def validate_username(username: str) -> str | None:
    """
    Return None if valid, or an error string if invalid.
    Allowed: 3–32 chars, alphanumeric, underscore, hyphen.
    """
    if not username:
        return "Username is required."
    if not _USERNAME_RE.match(username):
        return "Username must be 3–32 characters (letters, numbers, _ or -)."
    return None


def validate_password(password: str) -> str | None:
    """
    Return None if valid, or an error string if invalid.
    Requires at least 8 characters.
    """
    if not password:
        return "Password is required."
    if len(password) < 8:
        return "Password must be at least 8 characters."
    return None


def validate_email(email: str) -> str | None:
    """
    Return None if valid or empty (email is optional), or an error string.
    """
    if not email:
        return None  # email is optional
    if not _EMAIL_RE.match(email):
        return "Invalid email address."
    return None


# ── Sanitisation ──────────────────────────────────────────────────────────────

def truncate(text: str, max_len: int = 4096) -> str:
    """Truncate a string to max_len characters."""
    if len(text) <= max_len:
        return text
    return text[:max_len]
