from datetime import datetime, timedelta

from jose import jwt, JWTError

# --------------------------------------------------
# JWT Config
# --------------------------------------------------

SECRET_KEY = "memorymesh-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --------------------------------------------------
# Demo Users
# --------------------------------------------------

fake_users_db = {
    "admin": {
        "username": "admin",
        "password": "admin123"
    }
}

# --------------------------------------------------
# Authentication
# --------------------------------------------------

def authenticate_user(username: str, password: str):

    user = fake_users_db.get(username)

    if not user:
        return None

    if user["password"] != password:
        return None

    return user


# --------------------------------------------------
# Create JWT Token
# --------------------------------------------------

def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update(
        {"exp": expire}
    )

    token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# --------------------------------------------------
# Verify JWT Token
# --------------------------------------------------

def verify_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")

        if username is None:
            return None

        return username

    except JWTError:
        return None
