"""Tests for interview scheduler endpoints."""
import pytest
from datetime import datetime, timezone, timedelta


def _make_lead(client, auth_headers, suffix=""):
    res = client.post("/api/leads", headers=auth_headers, json={
        "name": f"Interview Test Cand{suffix}",
        "email": f"ivcand{suffix}@example.com",
        "skills": ["Python"],
        "experience": 3,
    })
    assert res.status_code in (200, 201)
    return res.json()["id"]


def test_list_interviews_empty(client, auth_headers):
    res = client.get("/api/interviews", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_create_interview(client, auth_headers):
    lead_id = _make_lead(client, auth_headers, "1")
    future = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    res = client.post("/api/interviews", headers=auth_headers, json={
        "lead_id": lead_id,
        "interviewer_name": "HR Manager",
        "interviewer_email": "hr@corp.com",
        "scheduled_at": future,
        "duration_minutes": 45,
        "notes": "Technical screen",
        "meeting_link": "https://meet.google.com/abc-def",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["lead_id"] == lead_id
    assert data["status"] == "scheduled"
    assert data["duration_minutes"] == 45
    return data["id"]


def test_create_interview_invalid_lead(client, auth_headers):
    res = client.post("/api/interviews", headers=auth_headers, json={
        "lead_id": "nonexistent-lead-id",
        "interviewer_name": "Test",
    })
    assert res.status_code == 404


def test_patch_interview_status(client, auth_headers):
    lead_id = _make_lead(client, auth_headers, "2")
    future = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    create = client.post("/api/interviews", headers=auth_headers, json={
        "lead_id": lead_id, "scheduled_at": future,
    })
    iv_id = create.json()["id"]

    patch = client.patch(f"/api/interviews/{iv_id}", headers=auth_headers, json={"status": "confirmed"})
    assert patch.status_code == 200
    assert patch.json()["status"] == "confirmed"


def test_patch_interview_invalid_status(client, auth_headers):
    lead_id = _make_lead(client, auth_headers, "3")
    create = client.post("/api/interviews", headers=auth_headers, json={"lead_id": lead_id})
    iv_id = create.json()["id"]

    patch = client.patch(f"/api/interviews/{iv_id}", headers=auth_headers, json={"status": "flying"})
    assert patch.status_code == 400


def test_delete_interview(client, auth_headers):
    lead_id = _make_lead(client, auth_headers, "4")
    create = client.post("/api/interviews", headers=auth_headers, json={"lead_id": lead_id})
    iv_id = create.json()["id"]

    delete = client.delete(f"/api/interviews/{iv_id}", headers=auth_headers)
    assert delete.status_code == 200


def test_interview_stats(client, auth_headers):
    res = client.get("/api/interviews/stats", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "scheduled" in data
    assert "completed" in data


def test_interviews_require_auth(client):
    res = client.get("/api/interviews")
    assert res.status_code == 401
