from fastapi import APIRouter, Depends
from auth_dependency import get_current_user
from .verifier import generate_deletion_proof
from .merkle_log import AuditLogger

router = APIRouter()

logger = AuditLogger()

@router.get("/audit-proof")
def audit_proof(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    return generate_deletion_proof(
        logger,
        user_id
    )