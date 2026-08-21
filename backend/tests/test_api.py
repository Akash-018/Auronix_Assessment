import pytest
from fastapi.testclient import TestClient
import os
import sys

# Ensure backend path is added
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_login_invalid_credentials():
    response = client.post("/api/auth/login", json={"email": "wrong@email.com", "password": "wrong"})
    assert response.status_code == 401
