"""
shared/logger.py — Structured logging for MemoryMesh backend.

Usage:
    from shared.logger import get_logger
    log = get_logger(__name__)
    log.info("User logged in", extra={"username": "alice"})
"""
import logging
import sys
import json
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    """Emit log records as single-line JSON — easy to ingest by log aggregators."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.now(tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        # Merge any extra fields passed via extra={}
        for key, val in record.__dict__.items():
            if key not in logging.LogRecord.__dict__ and not key.startswith("_"):
                payload[key] = val
        return json.dumps(payload, default=str)


def get_logger(name: str) -> logging.Logger:
    """
    Return a logger with JSON output on stdout.
    Re-using an already-configured logger is safe (idempotent).
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger  # already configured

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger


# Root app logger — import this directly for one-liners
log = get_logger("memorymesh")
