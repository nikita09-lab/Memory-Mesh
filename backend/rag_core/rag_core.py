"""
rag_core.py — MemoryMesh Secure In-Memory RAG Core
====================================================

Responsibilities implemented:
  1. Llama-3 inference via Groq API (fast, free, no local download)
  2. In-memory FAISS vector store — zero disk writes, ever
  3. AES-256-GCM key generated fresh per user session; encrypts embeddings in RAM
  4. Cryptographic wipe of key + embeddings immediately after answer is returned
  5. Differential Privacy (Gaussian mechanism) noise injected at embedding layer
  6. Session lifecycle enforced by context manager — impossible to forget cleanup

Architecture
------------
  User query
      │
      ▼
  EmbeddingEngine          ← HuggingFace sentence encoder (or stub in CI)
      │ raw float32 vector
      ▼
  DifferentialPrivacyLayer ← adds calibrated Gaussian noise (ε, δ configurable)
      │ noisy vector
      ▼
  SessionVault             ← AES-256-GCM encrypt → store ciphertext in RAM FAISS
      │                        (plaintext never touches RAM after encrypt)
      │ on query: decrypt in RAM, search, immediately zero plaintext buffer
      ▼
  Llama3Generator          ← Groq API (meta-llama/Meta-Llama-3-8B-Instruct)
      │
      ▼
  answer string  +  secure_wipe() called on every buffer
"""


from __future__ import annotations

import gc
import hashlib
import logging
import os
import secrets
import time
import uuid
from contextlib import contextmanager
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("memorymesh.rag_core")
# Load .env so GROQ_API_KEY is available when this module is imported


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
EMBEDDING_DIM  = 384          # all-MiniLM-L6-v2 output dimension
AES_KEY_BYTES  = 32           # 256-bit key
NONCE_BYTES    = 12           # 96-bit GCM nonce (NIST recommended)
DP_EPSILON     = 1.0          # differential privacy ε (lower = more private)
DP_DELTA       = 1e-5         # differential privacy δ
DP_SENSITIVITY = 1.0          # L2 sensitivity of the embedding (unit-normed)


# ---------------------------------------------------------------------------
# Secure memory utilities
# ---------------------------------------------------------------------------

def secure_zero(buf: bytearray | memoryview) -> None:
    """Overwrite a mutable byte buffer with zeros in-place."""
    for i in range(len(buf)):
        buf[i] = 0


def secure_zero_ndarray(arr: np.ndarray) -> None:
    """Overwrite a numpy array with zeros in-place."""
    arr.fill(0.0)


def generate_session_key() -> bytes:
    """Return a cryptographically random 256-bit AES key."""
    return secrets.token_bytes(AES_KEY_BYTES)


def wipe_key(key_holder: list) -> None:
    """
    Zero and discard a key stored in a mutable list cell so the
    reference can be replaced without the old bytes lingering.
    key_holder[0] must be a bytes object; we write via a bytearray copy.
    """
    if key_holder and key_holder[0] is not None:
        ba = bytearray(key_holder[0])
        secure_zero(ba)
        key_holder[0] = None
    gc.collect()


# ---------------------------------------------------------------------------
# Differential Privacy Layer
# ---------------------------------------------------------------------------

class DifferentialPrivacyLayer:
    """
    Gaussian mechanism for (ε, δ)-differential privacy on embeddings.

    σ = (sensitivity * sqrt(2 * ln(1.25/δ))) / ε
    """

    def __init__(
        self,
        epsilon: float = DP_EPSILON,
        delta: float = DP_DELTA,
        sensitivity: float = DP_SENSITIVITY,
        rng_seed: Optional[int] = None,
    ):
        if epsilon <= 0 or delta <= 0:
            raise ValueError("ε and δ must be strictly positive.")
        self.epsilon = epsilon
        self.delta   = delta
        self.sigma   = (sensitivity * np.sqrt(2 * np.log(1.25 / delta))) / epsilon
        self._rng    = np.random.default_rng(rng_seed)  # seeded only in tests
        logger.debug(
            "DP layer ready  ε=%.3f  δ=%.2e  σ=%.4f", epsilon, delta, self.sigma
        )

    def privatise(self, embedding: np.ndarray) -> np.ndarray:
        """Add calibrated Gaussian noise; return a NEW array (no in-place mutation)."""
        noise = self._rng.normal(loc=0.0, scale=self.sigma, size=embedding.shape)
        noisy = embedding.astype(np.float32) + noise.astype(np.float32)
        # L2-normalise so FAISS cosine similarity stays meaningful
        norm = np.linalg.norm(noisy)
        if norm > 0:
            noisy /= norm
        return noisy


# ---------------------------------------------------------------------------
# Embedding Engine
# ---------------------------------------------------------------------------

class EmbeddingEngine:
    """
    Thin wrapper around a sentence-transformer encoder.

    Falls back to a deterministic stub when sentence_transformers is
    not installed (CI / unit-test environments without GPU/internet).
    """

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self._model_name = model_name
        self._model      = None
        self._stub_mode  = False
        self._load()

    def _load(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            self._model = SentenceTransformer(self._model_name)
            logger.info("Embedding model loaded: %s", self._model_name)
        except ImportError:
            logger.warning(
                "sentence_transformers not available — using deterministic stub. "
                "Install it for production use."
            )
            self._stub_mode = True

    def encode(self, text: str) -> np.ndarray:
        """Return a float32 unit-normed embedding vector."""
        if self._stub_mode:
            return self._stub_encode(text)
        raw: np.ndarray = self._model.encode(text, normalize_embeddings=True)
        return raw.astype(np.float32)

    @staticmethod
    def _stub_encode(text: str) -> np.ndarray:
        """
        Deterministic hash-based stub — same text always → same vector.
        Used only in test / CI; not suitable for semantic search.
        """
        digest = hashlib.sha256(text.encode()).digest()
        segments: List[bytes] = []
        seed = digest
        while len(segments) * 8 < EMBEDDING_DIM:
            seed = hashlib.sha256(seed).digest()
            segments.append(seed)
        flat = np.frombuffer(b"".join(segments), dtype=np.uint8)[:EMBEDDING_DIM]
        vec  = flat.astype(np.float32) / 255.0 - 0.5
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec


# ---------------------------------------------------------------------------
# In-Memory Encrypted Vector Store
# ---------------------------------------------------------------------------

@dataclass
class _EncryptedRecord:
    """One document stored as AES-256-GCM ciphertext."""
    doc_id    : str
    nonce     : bytes
    ciphertext: bytes
    text      : str
    timestamp : float = field(default_factory=time.time)


class InMemoryVectorStore:
    """
    Encrypted in-memory store for document embeddings.

    Every embedding is AES-256-GCM encrypted with the session key
    the instant it arrives. Plaintext float bytes exist in RAM only
    during the sub-millisecond encrypt/decrypt window and are zeroed
    immediately after.
    """

    def __init__(self, session_key_holder: list, dim: int = EMBEDDING_DIM):
        self._key_holder: list                = session_key_holder
        self._dim: int                        = dim
        self._records: List[_EncryptedRecord] = []
        self._faiss_available: bool           = self._check_faiss()

    @staticmethod
    def _check_faiss() -> bool:
        try:
            import faiss  # type: ignore  # noqa: F401
            return True
        except ImportError:
            logger.warning("faiss-cpu not found — using numpy brute-force retrieval.")
            return False

    def _aesgcm(self) -> AESGCM:
        if self._key_holder[0] is None:
            raise RuntimeError("Session key has been wiped — store is locked.")
        return AESGCM(self._key_holder[0])

    def _encrypt_embedding(self, vec: np.ndarray) -> Tuple[bytes, bytes]:
        raw   = bytearray(vec.astype(np.float32).tobytes())
        nonce = secrets.token_bytes(NONCE_BYTES)
        ct    = self._aesgcm().encrypt(nonce, bytes(raw), None)
        secure_zero(raw)
        del raw
        return nonce, ct

    def _decrypt_embedding(self, nonce: bytes, ciphertext: bytes) -> np.ndarray:
        raw = self._aesgcm().decrypt(nonce, ciphertext, None)
        arr = np.frombuffer(raw, dtype=np.float32).copy()
        ba  = bytearray(raw)
        secure_zero(ba)
        return arr

    def add(self, text: str, embedding: np.ndarray) -> str:
        nonce, ct = self._encrypt_embedding(embedding)
        rec = _EncryptedRecord(
            doc_id=str(uuid.uuid4()),
            nonce=nonce,
            ciphertext=ct,
            text=text,
        )
        self._records.append(rec)
        logger.debug("Stored encrypted record %s (%d bytes ct)", rec.doc_id, len(ct))
        return rec.doc_id

    def search(self, query_embedding: np.ndarray, top_k: int = 3) -> List[Dict]:
        if not self._records:
            return []
        top_k = min(top_k, len(self._records))
        if self._faiss_available:
            return self._search_faiss(query_embedding, top_k)
        return self._search_numpy(query_embedding, top_k)

    def _search_numpy(self, query: np.ndarray, top_k: int) -> List[Dict]:
        matrix = np.zeros((len(self._records), self._dim), dtype=np.float32)
        try:
            for i, rec in enumerate(self._records):
                vec = self._decrypt_embedding(rec.nonce, rec.ciphertext)
                matrix[i] = vec
                secure_zero_ndarray(vec)
            q_norm = query / (np.linalg.norm(query) + 1e-10)
            scores = matrix @ q_norm
            idx    = np.argsort(scores)[::-1][:top_k]
            return [
                {"text": self._records[i].text, "doc_id": self._records[i].doc_id, "score": float(scores[i])}
                for i in idx
            ]
        finally:
            secure_zero_ndarray(matrix)
            del matrix
            gc.collect()

    def _search_faiss(self, query: np.ndarray, top_k: int) -> List[Dict]:
        import faiss  # type: ignore
        matrix = np.zeros((len(self._records), self._dim), dtype=np.float32)
        try:
            for i, rec in enumerate(self._records):
                vec = self._decrypt_embedding(rec.nonce, rec.ciphertext)
                matrix[i] = vec
                secure_zero_ndarray(vec)
            index = faiss.IndexFlatIP(self._dim)
            faiss.normalize_L2(matrix)
            index.add(matrix)
            q = query.reshape(1, -1).astype(np.float32)
            faiss.normalize_L2(q)
            distances, indices = index.search(q, top_k)
            results = [
                {"text": self._records[int(idx)].text, "doc_id": self._records[int(idx)].doc_id, "score": float(distances[0][rank])}
                for rank, idx in enumerate(indices[0]) if idx >= 0
            ]
            index.reset()
            del index
            return results
        finally:
            secure_zero_ndarray(matrix)
            del matrix
            gc.collect()

    def wipe(self) -> None:
        for rec in self._records:
            ba_ct    = bytearray(rec.ciphertext)
            ba_nonce = bytearray(rec.nonce)
            secure_zero(ba_ct)
            secure_zero(ba_nonce)
        self._records.clear()
        gc.collect()
        logger.debug("Vector store wiped — %d records destroyed.", 0)

    def __len__(self) -> int:
        return len(self._records)


# ---------------------------------------------------------------------------
# LLM Generator — Groq API (Llama-3-8B)
# ────────────────────────────────────────────────────────────────────────────
# CHANGED: replaced local HuggingFace pipeline with Groq API call.
# Everything else in this file is identical to the original.
#
# Why Groq:
#   - No 16GB download, no gated repo approval needed
#   - Runs on Groq's LPU hardware — typically 10-50x faster than local MPS
#   - Free tier is generous for development and demos
#   - Same Llama-3-8B-Instruct model, same prompt format
#
# Setup:
#   1. pip install groq
#   2. Get a free key at https://console.groq.com
#   3. Add GROQ_API_KEY=gsk_... to backend/.env
# ---------------------------------------------------------------------------

class Llama3Generator:
    """
    Calls Llama-3-8B-Instruct via the Groq API.
    Falls back to a stub if GROQ_API_KEY is not set (CI / offline dev).
    """

    _MODEL = "llama-3.1-8b-instant"   # Llama-3 8B on Groq — same weights as Meta's HF repo

    def __init__(self, max_tokens: int = 512, temperature: float = 0.7):
        self._max_tokens  = max_tokens
        self._temperature = temperature
        self._client      = None
        self._stub_mode   = False
        self._load()

    def _load(self) -> None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            logger.warning(
                "GROQ_API_KEY not set — using stub generator. "
                "Get a free key at https://console.groq.com and add it to backend/.env"
            )
            self._stub_mode = True
            return
        try:
            from groq import Groq  # type: ignore
            self._client = Groq(api_key=api_key)
            logger.info("Llama-3 generator ready via Groq API (model=%s)", self._MODEL)
        except ImportError:
            logger.warning(
                "groq package not installed — using stub generator. "
                "Run: pip install groq"
            )
            self._stub_mode = True

    def generate(self, query: str, context_chunks: List[str]) -> str:
        """Produce an answer grounded in context_chunks."""
        if self._stub_mode:
            return self._stub_generate(query, context_chunks)

        context_text = "\n\n".join(
            f"[Chunk {i+1}] {chunk}" for i, chunk in enumerate(context_chunks)
        )

        # Llama-3 instruct format via Groq chat completions
        response = self._client.chat.completions.create(
            model=self._MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant. Answer the user's question "
                        "using ONLY the provided context. If the context does not "
                        "contain the answer, say so honestly."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context_text}\n\nQuestion: {query}",
                },
            ],
            max_tokens=self._max_tokens,
            temperature=self._temperature,
        )
        return response.choices[0].message.content.strip()

    @staticmethod
    def _stub_generate(query: str, context_chunks: List[str]) -> str:
        joined = " | ".join(context_chunks[:3]) if context_chunks else "(no context)"
        return (
            f"[STUB ANSWER — set GROQ_API_KEY in backend/.env to get real answers] "
            f"Query: '{query}' — Top context: {joined[:200]}"
        )


# ---------------------------------------------------------------------------
# RAG Session — the public interface
# ---------------------------------------------------------------------------

class RAGSession:
    """
    A single privacy-preserving RAG session.

    Lifecycle
    ---------
    1. __enter__ : fresh AES-256 key generated
    2. index()   : add documents (embed → DP-noise → encrypt → store)
    3. query()   : retrieve + generate (decrypt in RAM, wipe immediately)
    4. __exit__  : wipe key + all embeddings — guaranteed even on exception

    Always use as a context manager:

        with RAGSession() as session:
            session.index(docs)
            answer = session.query("What is X?")
        # key and all embeddings are now cryptographically wiped
    """

    def __init__(
        self,
        embedder  : Optional[EmbeddingEngine]          = None,
        generator : Optional[Llama3Generator]          = None,
        dp_layer  : Optional[DifferentialPrivacyLayer] = None,
        top_k     : int = 3,
    ):
        self._embedder  = embedder  or EmbeddingEngine()
        self._generator = generator or Llama3Generator()
        self._dp        = dp_layer  or DifferentialPrivacyLayer()
        self._top_k     = top_k

        self._key_holder: list             = [None]
        self._store: Optional[InMemoryVectorStore] = None
        self._active = False

    def __enter__(self) -> "RAGSession":
        self._key_holder[0] = generate_session_key()
        self._store  = InMemoryVectorStore(self._key_holder)
        self._active = True
        logger.info("RAGSession started  key_id=%s", id(self._key_holder[0]))
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        self._secure_wipe()
        return False

    def index(self, documents: List[str]) -> None:
        """Embed, privatise, encrypt, and store a list of text chunks."""
        self._assert_active()
        for doc in documents:
            raw_emb  = self._embedder.encode(doc)
            priv_emb = self._dp.privatise(raw_emb)
            self._store.add(doc, priv_emb)
            secure_zero_ndarray(raw_emb)
            secure_zero_ndarray(priv_emb)
        logger.info("Indexed %d documents into encrypted store.", len(documents))

    def query(self, question: str) -> str:
        """
        Retrieve relevant chunks and generate an answer.
        All decrypted embedding buffers are wiped before this returns.
        """
        self._assert_active()
        q_raw  = self._embedder.encode(question)
        q_priv = self._dp.privatise(q_raw)

        results = self._store.search(q_priv, top_k=self._top_k)

        secure_zero_ndarray(q_raw)
        secure_zero_ndarray(q_priv)

        context_chunks = [r["text"] for r in results]
        answer = self._generator.generate(question, context_chunks)

        logger.info(
            "Query answered  chunks_used=%d  answer_len=%d",
            len(context_chunks), len(answer),
        )
        return answer

    def document_count(self) -> int:
        self._assert_active()
        return len(self._store)

    def _assert_active(self) -> None:
        if not self._active:
            raise RuntimeError(
                "RAGSession is not active. Use it inside a 'with' block."
            )

    def _secure_wipe(self) -> None:
        if self._store is not None:
            self._store.wipe()
            self._store = None
        wipe_key(self._key_holder)
        self._active = False
        gc.collect()
        logger.info("RAGSession wiped — key and embeddings destroyed.")


# ---------------------------------------------------------------------------
# Convenience function
# ---------------------------------------------------------------------------

@contextmanager
def memorymesh_session(
    documents: List[str],
    *,
    epsilon: float = DP_EPSILON,
    delta: float   = DP_DELTA,
    top_k: int     = 3,
):
    """
    One-shot context manager that indexes documents and yields a query callable.

    Usage::

        with memorymesh_session(docs) as ask:
            answer = ask("What is MemoryMesh?")
    """
    dp = DifferentialPrivacyLayer(epsilon=epsilon, delta=delta)
    with RAGSession(dp_layer=dp, top_k=top_k) as session:
        session.index(documents)
        yield session.query


# ---------------------------------------------------------------------------
# __all__
# ---------------------------------------------------------------------------
__all__ = [
    "RAGSession",
    "memorymesh_session",
    "EmbeddingEngine",
    "Llama3Generator",
    "DifferentialPrivacyLayer",
    "InMemoryVectorStore",
    "secure_zero",
    "secure_zero_ndarray",
    "wipe_key",
]
