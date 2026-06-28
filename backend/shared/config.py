"""
shared/config.py — Centralized configuration for MemoryMesh backend.
All values read from environment variables with safe defaults.
Load a .env file in development by running:
    pip install python-dotenv
    # then at app startup:
    from dotenv import load_dotenv; load_dotenv()
"""
import os
import secrets


def _require(name: str) -> str:
    """Return env var or raise a clear error at startup."""
    val = os.getenv(name)
    if not val:
        raise RuntimeError(
            f"[MemoryMesh] Required environment variable '{name}' is not set. "
            f"Copy backend/.env.example to backend/.env and fill it in."
        )
    return val


class Settings:
    # ── JWT ──────────────────────────────────────────────────────────────────
    # NEVER hardcode this. Generate with: python -c "import secrets; print(secrets.token_hex(64))"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DB_PATH: str = os.getenv("DB_PATH", "./audit.db")

    # ── CORS ─────────────────────────────────────────────────────────────────
    # Comma-separated list: "http://localhost:5173,https://yourdomain.com"
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]

    # ── Rate limiting ─────────────────────────────────────────────────────────
    LOGIN_RATE_LIMIT: str = os.getenv("LOGIN_RATE_LIMIT", "10/minute")

    # ── Environment ───────────────────────────────────────────────────────────
    ENV: str = os.getenv("ENV", "development")

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    def validate(self) -> None:
        """Call this at app startup to catch misconfigurations early."""
        if not self.SECRET_KEY:
            if self.is_production:
                raise RuntimeError(
                    "[MemoryMesh] SECRET_KEY must be set in production. "
                    "Generate with: python -c \"import secrets; print(secrets.token_hex(64))\""
                )
            else:
                # In dev, generate a random key but warn loudly
                import warnings
                self.SECRET_KEY = secrets.token_hex(64)
                warnings.warn(
                    "[MemoryMesh] SECRET_KEY not set — using a random key. "
                    "All existing tokens will be invalidated on restart. "
                    "Set SECRET_KEY in your .env file.",
                    UserWarning,
                    stacklevel=2,
                )

        if len(self.SECRET_KEY) < 32:
            raise RuntimeError(
                "[MemoryMesh] SECRET_KEY is too short. "
                "Use at least 64 hex characters (256 bits)."
            )

        if not os.getenv("GROQ_API_KEY"):
            if self.is_production:
                raise RuntimeError("[MemoryMesh] GROQ_API_KEY must be set in production.")
            else:
                import warnings
                warnings.warn("[MemoryMesh] GROQ_API_KEY not set — RAG queries will return stub answers.", UserWarning)

        admin_pass = os.getenv("ADMIN_PASSWORD", "")
        if self.is_production and (not admin_pass or admin_pass == "ChangeMe123!"):
            raise RuntimeError("[MemoryMesh] Set a strong ADMIN_PASSWORD in production.")

settings = Settings()
