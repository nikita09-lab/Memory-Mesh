import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
from merkle_log import (
    AuditLogger,
    AuditEvent,
    MerkleTree
)

logger = AuditLogger()

event = AuditEvent(
    "1",
    "u1",
    "s1",
    "SESSION_START",
    "2026"
)

logger.log_event(event)

root = logger.get_root()

proof = logger.tree.generate_proof(0)

tampered_hash = "malicious_data"

result = MerkleTree.verify_proof(
    tampered_hash,
    proof,
    root
)

print(
    "Tampering Detected:",
    not result
)