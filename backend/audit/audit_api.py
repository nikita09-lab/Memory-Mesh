from fastapi import APIRouter
from verifier import generate_deletion_proof
from merkle_log import AuditLogger

router = APIRouter()

logger = AuditLogger()


@router.get("/audit-proof")
def audit_proof(user_id: str):

    return generate_deletion_proof(
        logger,
        user_id
    )