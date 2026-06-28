import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)
import json
from pathlib import Path

from merkle_log import AuditLogger
from verifier import generate_deletion_proof

logger = AuditLogger()

proof = generate_deletion_proof(
    logger,
    "u1"
)

output_file = (
    Path(__file__).parent.parent
    / "sample_proof.json"
)

with open(
    output_file,
    "w"
) as file:

    json.dump(
        proof,
        file,
        indent=4
    )

print("sample_proof.json created")
