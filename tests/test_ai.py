"""Tests for AI endpoints (fallback mode — no real Gemini needed)."""
import pytest


def test_ai_chat_requires_auth(client):
    res = client.post("/api/ai/chat", json={"question": "hello"})
    assert res.status_code == 401


def test_ai_chat_empty_question(client, auth_headers):
    res = client.post("/api/ai/chat", json={"question": ""}, headers=auth_headers)
    assert res.status_code in (400, 503)


def test_job_desc_generator_fallback(client, auth_headers):
    """Should return a structured JD even without Gemini (keyword fallback)."""
    res = client.post("/api/ai/job-description-generator", headers=auth_headers, json={
        "description": "We need a senior Python developer with FastAPI and AWS experience, 5 years minimum",
        "company": "Test Corp",
        "location": "Remote",
        "save_as_job": False,
    })
    assert res.status_code == 200
    data = res.json()
    assert "title" in data
    assert "required_skills" in data
    assert isinstance(data["required_skills"], list)
    assert "responsibilities" in data
    assert isinstance(data["responsibilities"], list)
    assert "full_description" in data
    assert len(data["full_description"]) > 50


def test_job_desc_generator_empty_description(client, auth_headers):
    res = client.post("/api/ai/job-description-generator", headers=auth_headers, json={
        "description": "   ",
        "company": "Corp",
    })
    assert res.status_code == 400


def test_job_desc_generator_saves_job(client, auth_headers):
    res = client.post("/api/ai/job-description-generator", headers=auth_headers, json={
        "description": "Need a React developer with TypeScript, 3 years exp",
        "company": "Save Test Corp",
        "location": "Bangalore",
        "save_as_job": True,
    })
    assert res.status_code == 200
    data = res.json()
    assert data.get("job_id") is not None

    # Verify it was actually saved
    job_res = client.get(f"/api/jobs/{data['job_id']}", headers=auth_headers)
    assert job_res.status_code == 200
    assert job_res.json()["source"] == "ai-generated"


def test_candidate_brief_not_found(client, auth_headers):
    res = client.post("/api/ai/candidate-brief/nonexistent-id", headers=auth_headers)
    assert res.status_code == 404


def test_resume_match_fallback(client, auth_headers):
    """Resume match should work via fallback even without Gemini."""
    res = client.post("/api/resumes/match", headers=auth_headers, json={
        "resume_text": "Python developer with 5 years Django FastAPI AWS experience",
        "job_description": "Looking for Python FastAPI developer",
        "job_skills": ["Python", "FastAPI"],
        "job_experience_min": 3,
    })
    assert res.status_code == 200
    data = res.json()
    assert "score" in data
    assert 0 <= data["score"] <= 100
    assert "matched_skills" in data
