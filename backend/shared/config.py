"""
shared/config.py — Centralized configuration for MemoryMesh backend.
All values read from environment variables with safe defaults.
"""
import os
import secrets


class Settings:
    # ── JWT ───────────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    # ── Database (Supabase Postgres) ──────────────────────────────────────────
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # ── CORS ──────────────────────────────────────────────────────────────────
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
                import warnings
                self.SECRET_KEY = secrets.token_hex(64)
                warnings.warn(
                    "[MemoryMesh] SECRET_KEY not set — using a random key. "
                    "All tokens will be invalidated on restart.",
                    UserWarning,
                    stacklevel=2,
                )

        if len(self.SECRET_KEY) < 32:
            raise RuntimeError("[MemoryMesh] SECRET_KEY is too short (min 32 chars).")

        if not self.DATABASE_URL:
            raise RuntimeError(
                "[MemoryMesh] DATABASE_URL must be set. "
                "Format: postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres"
            )

        if not os.getenv("GROQ_API_KEY"):
            if self.is_production:
                raise RuntimeError("[MemoryMesh] GROQ_API_KEY must be set in production.")
            else:
                import warnings
                warnings.warn(
                    "[MemoryMesh] GROQ_API_KEY not set — RAG queries will return stub answers.",
                    UserWarning,
                )

        admin_pass = os.getenv("ADMIN_PASSWORD", "")
        if self.is_production and (not admin_pass or admin_pass == "ChangeMe123!"):
            raise RuntimeError("[MemoryMesh] Set a strong ADMIN_PASSWORD in production.")


settings = Settings()