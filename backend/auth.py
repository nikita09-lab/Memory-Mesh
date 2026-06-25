from datetime import datetime, timedelta
from jose import jwt, JWTError
import hashlib

SECRET_KEY = "memorymesh-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# In-memory user store (username -> user dict)
# Passwords stored as plain for demo; in production use bcrypt
users_db = {
    "admin": {"username": "admin", "password": "admin123", "role": "admin", "email": "admin@memorymesh.ai"},
}

# Chat history per user: username -> list of {role, content, timestamp}
chat_history_db = {}

# ---- User management ----

def get_all_users():
    return [{"username": u, "role": v["role"], "email": v["email"]} for u, v in users_db.items()]

def register_user(username: str, password: str, email: str = ""):
    if username in users_db:
        return None, "Username already exists"
    if len(password) < 4:
        return None, "Password too short"
    users_db[username] = {"username": username, "password": password, "role": "user", "email": email}
    return users_db[username], None

def delete_user_permanently(username: str):
    if username not in users_db:
        return False, "User not found"
    if username == "admin":
        return False, "Cannot delete admin"
    del users_db[username]
    # Also wipe chat history
    chat_history_db.pop(username, None)
    return True, "User deleted"

def authenticate_user(username: str, password: str):
    user = users_db.get(username)
    if not user:
        return None
    if user["password"] != password:
        return None
    return user

# ---- Chat history ----

def save_chat_message(username: str, role: str, content: str):
    if username not in chat_history_db:
        chat_history_db[username] = []
    chat_history_db[username].append({
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    })

def get_chat_history(username: str):
    return chat_history_db.get(username, [])

def delete_chat_history(username: str):
    deleted = len(chat_history_db.get(username, []))
    chat_history_db.pop(username, None)
    return deleted

# ---- JWT ----

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None
