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

def test_bootstrap_and_authorization():
    # Test bootstrap environment variable creation
    os.environ["BOOTSTRAP_ADMIN_EMAIL"] = "admin_test@pixeltest.com"
    os.environ["BOOTSTRAP_ADMIN_PASSWORD"] = "AdminSecret123!"
    os.environ["BOOTSTRAP_USER_EMAIL"] = "user_test@pixeltest.com"
    os.environ["BOOTSTRAP_USER_PASSWORD"] = "UserSecret123!"

    from app.core.database import SessionLocal
    from app.core.bootstrap import init_bootstrap_users

    db = SessionLocal()
    try:
        init_bootstrap_users(db)
    finally:
        db.close()

    # 1. Login as User
    user_login = client.post("/api/auth/login", json={"email": "user_test@pixeltest.com", "password": "UserSecret123!"})
    assert user_login.status_code == 200
    user_token = user_login.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 2. Verify User cannot call Admin API (Create Challenge -> 403)
    admin_action = client.post("/api/challenges", json={"title": "Unauthorized Test"}, headers=user_headers)
    assert admin_action.status_code == 403

    # 3. Login as Admin
    admin_login = client.post("/api/auth/login", json={"email": "admin_test@pixeltest.com", "password": "AdminSecret123!"})
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 4. Admin creates test
    create_res = client.post("/api/challenges", json={"title": "Admin Created Test"}, headers=admin_headers)
    assert create_res.status_code == 200
    challenge_id = create_res.json()["id"]

    # 5. User views challenges (draft not visible to user)
    user_list = client.get("/api/challenges", headers=user_headers)
    assert user_list.status_code == 200
    assert not any(c["id"] == challenge_id for c in user_list.json())

    # 6. Admin publishes test
    pub_res = client.put(f"/api/challenges/{challenge_id}", json={"status": "ACTIVE"}, headers=admin_headers)
    assert pub_res.status_code == 200

    # 7. User now sees published test
    user_list_published = client.get("/api/challenges", headers=user_headers)
    assert user_list_published.status_code == 200
    assert any(c["id"] == challenge_id for c in user_list_published.json())

