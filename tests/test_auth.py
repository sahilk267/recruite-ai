"""Tests for authentication endpoints."""
import pytest


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_register_and_login(client):
    import time
    unique_email = f"newuser_{int(time.time())}@test.com"
    res = client.post("/api/auth/register", json={
        "name": "New User",
        "email": unique_email,
        "password": "password123",
    })
    assert res.status_code in (200, 201)
    data = res.json()
    assert "token" in data
    # register response: token + user object (may be nested or flat)
    assert "token" in data

    login = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "password123",
    })
    assert login.status_code == 200
    assert "token" in login.json()


def test_login_wrong_password(client):
    res = client.post("/api/auth/login", json={
        "email": "test@recruiteai.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_login_unknown_email(client):
    res = client.post("/api/auth/login", json={
        "email": "nobody@nowhere.com",
        "password": "anything",
    })
    assert res.status_code == 401


def test_me_authenticated(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    # /api/auth/me returns the user object directly or nested under "user"
    user = data.get("user", data)
    assert user.get("email") == "test@recruiteai.com"
    assert user.get("role") == "admin"


def test_me_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_invalid_token(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert res.status_code == 401
