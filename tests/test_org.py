"""Tests for org, RBAC, and subscription endpoints."""
import pytest


def test_get_org(client, auth_headers):
    res = client.get("/api/org", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "plan" in data
    assert "ai_calls_used" in data
    assert "ai_calls_limit" in data


def test_get_subscription(client, auth_headers):
    res = client.get("/api/subscription", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "plan" in data
    assert "ai_calls_used" in data
    assert "ai_calls_remaining" in data
    assert "recent_usage" in data


def test_upgrade_plan(client, auth_headers):
    res = client.post("/api/subscription/upgrade", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["plan"] == "pro"
    assert data["ai_calls_limit"] == 1000


def test_list_org_users(client, auth_headers):
    res = client.get("/api/org/users", headers=auth_headers)
    assert res.status_code == 200
    users = res.json()
    assert isinstance(users, list)
    assert any(u["email"] == "test@recruiteai.com" for u in users)


def test_list_roles(client, auth_headers):
    res = client.get("/api/admin/roles", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "roles" in data
    assert "admin" in data["roles"]
    assert "recruiter" in data["roles"]


def _register_user(client, name, email):
    """Register a user and return their ID regardless of response shape."""
    import time
    unique_email = f"{email.split('@')[0]}_{int(time.time())}@{email.split('@')[1]}"
    res = client.post("/api/auth/register", json={"name": name, "email": unique_email, "password": "pass12345"})
    assert res.status_code in (200, 201), f"Register failed: {res.text}"
    data = res.json()
    # Support both {user: {id: ...}} and {id: ..., token: ...}
    if "user" in data:
        return data["user"]["id"]
    return data.get("id") or data.get("user_id")


def test_update_user_role(client, auth_headers):
    user_id = _register_user(client, "Role Test User", "roletest@example.com")
    res = client.patch(f"/api/org/users/{user_id}/role", headers=auth_headers, json={"role": "recruiter"})
    assert res.status_code == 200
    assert res.json()["role"] == "recruiter"


def test_update_role_invalid(client, auth_headers):
    user_id = _register_user(client, "Bad Role User", "badrole@example.com")
    res = client.patch(f"/api/org/users/{user_id}/role", headers=auth_headers, json={"role": "superuser"})
    assert res.status_code == 400


def test_org_requires_auth(client):
    res = client.get("/api/org")
    assert res.status_code == 401
