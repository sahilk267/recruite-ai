"""Tests for leads (candidates) endpoints."""
import pytest


def test_list_leads(client, auth_headers):
    res = client.get("/api/leads", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "data" in data
    assert "total" in data
    assert isinstance(data["data"], list)


def test_create_lead(client, auth_headers):
    res = client.post("/api/leads", headers=auth_headers, json={
        "name": "Test Candidate",
        "email": "testcandidate@example.com",
        "skills": ["Python", "FastAPI"],
        "experience": 4,
    })
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["name"] == "Test Candidate"
    assert data["email"] == "testcandidate@example.com"
    assert "id" in data
    assert data["score"] > 0
    return data["id"]


def test_get_lead_by_id(client, auth_headers):
    # Create first
    create = client.post("/api/leads", headers=auth_headers, json={
        "name": "Get By ID Test",
        "email": "getbyid@example.com",
        "skills": ["React"],
        "experience": 2,
    })
    lead_id = create.json()["id"]

    res = client.get(f"/api/leads/{lead_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == lead_id


def test_get_lead_not_found(client, auth_headers):
    res = client.get("/api/leads/nonexistent-id-1234", headers=auth_headers)
    assert res.status_code == 404


def test_patch_lead(client, auth_headers):
    create = client.post("/api/leads", headers=auth_headers, json={
        "name": "Patch Test",
        "email": "patch@example.com",
        "skills": ["Go"],
        "experience": 3,
    })
    lead_id = create.json()["id"]

    patch = client.patch(f"/api/leads/{lead_id}", headers=auth_headers, json={
        "name": "Patched Name",
    })
    assert patch.status_code == 200
    assert patch.json()["name"] == "Patched Name"


def test_delete_lead(client, auth_headers):
    create = client.post("/api/leads", headers=auth_headers, json={
        "name": "Delete Me",
        "email": "deleteme@example.com",
        "skills": [],
        "experience": 0,
    })
    lead_id = create.json()["id"]

    delete = client.delete(f"/api/leads/{lead_id}", headers=auth_headers)
    assert delete.status_code == 200

    get = client.get(f"/api/leads/{lead_id}", headers=auth_headers)
    assert get.status_code == 404


def test_leads_require_auth(client):
    res = client.get("/api/leads")
    assert res.status_code == 401


def test_create_lead_missing_name(client, auth_headers):
    res = client.post("/api/leads", headers=auth_headers, json={
        "email": "noname@example.com",
    })
    assert res.status_code == 422
