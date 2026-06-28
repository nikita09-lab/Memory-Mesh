from fastapi import APIRouter, Depends, HTTPException

from auth_dependency import get_current_user

from .merkle_log import AuditLogger
from .verifier import generate_deletion_proof

router = APIRouter()

logger = AuditLogger()


@router.get("/audit-proof")
def audit_proof(user_id: str, current_user: str = Depends(get_current_user)):
    # Users can only view their own audit proof; admins can view anyone's
    from auth import get_all_users
    u = next((x for x in get_all_users() if x["username"] == current_user), {})
    if current_user != user_id and u.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")
    return generate_deletion_proof(logger, user_id)
