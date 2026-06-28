# tests/integration/test_api.py
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../backend"))
os.environ["SECRET_KEY"] = "a" * 64
os.environ["ENV"] = "test"
from main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200

def test_register_and_login():
    r = client.post("/register", json={"username": "testuser99", "password": "StrongPass1!"})
    assert r.status_code == 200
    r = client.post("/login", json={"username": "testuser99", "password": "StrongPass1!"})
    assert r.status_code == 200
    assert "access_token" in r.json()