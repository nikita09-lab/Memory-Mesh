# MemoryMesh Audit Trail Module

    ## Overview

    The Audit Trail Module provides tamper-evident logging for MemoryMesh. It records critical system events, stores them in an append-only SQLite database, and generates cryptographic proofs using Merkle Trees.

    The module allows regulators, auditors, or administrators to verify that deletion requests and key wipe operations occurred without exposing any user data.

    ---

    ## Features

    * SHA-256 hashing of audit events
    * Merkle Tree construction
    * Merkle Root generation
    * Merkle Proof generation
    * Merkle Proof verification
    * Append-only SQLite audit log
    * FastAPI audit endpoint
    * Tamper detection tests

    ---

    ## Architecture

    Audit Event
    → SHA-256 Hash
    → SQLite Storage
    → Merkle Tree
    → Proof Generation
    → /audit-proof API

    ---

    ## Event Types

    Supported audit events:

    * SESSION_START
    * ANSWER_GENERATED
    * KEY_WIPED
    * FORGET_REQUESTED
    * FORGET_COMPLETED

    ---

    ## API Endpoint

    ### Get Audit Proof

    GET /audit-proof?user_id=<user_id>

    Example:

    GET /audit-proof?user_id=u1

    Response:

    {
    "user_id": "u1",
    "event_count": 3,
    "merkle_root": "...",
    "events": [...],
    "deletion_confirmed": true
    }

    ---

    ## Running the API

    Install dependencies:

    pip install fastapi uvicorn

    Start server:

    uvicorn test_api:app --reload

    Swagger UI:

    http://127.0.0.1:8000/docs

    ---

    ## Test Files

    test_merkle.py

    Verifies Merkle Tree construction.

    test_storage.py

    Verifies SQLite storage and retrieval.

    test_proof.py

    Verifies proof generation.

    test_tampering.py

    Verifies tampering detection.

    test_append_only.py

    Verifies DELETE operations are blocked.

    test_update_block.py

    Verifies UPDATE operations are blocked.

    ---

    ## Security Properties

    * Audit events are hashed using SHA-256.
    * Audit records are append-only.
    * UPDATE operations are blocked.
    * DELETE operations are blocked.
    * Merkle proofs detect unauthorized modifications.

    ---

    ## Future Enhancements

    * RFC 3161 Trusted Timestamping
    * Digital signatures for proofs
    * External audit verification service
    * Distributed audit storage
