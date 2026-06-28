from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from auth import verify_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    username = verify_token(token)

    if not username:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    return username
