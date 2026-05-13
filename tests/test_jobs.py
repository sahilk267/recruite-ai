"""Tests for jobs endpoints."""
import pytest


def test_list_jobs(client, auth_headers):
    res = client.get("/api/jobs", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "data" in data or isinstance(data, list)


def test_create_job(client, auth_headers):
    res = client.post("/api/jobs", headers=auth_headers, json={
        "title": "Senior Python Developer",
        "company": "Test Corp",
        "location": "Remote",
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "experience_min": 3,
        "description": "Build backend APIs",
    })
    assert res.status_code in (200, 201)
    data = res.json()
    assert data["title"] == "Senior Python Developer"
    assert "id" in data


def test_get_job_by_id(client, auth_headers):
    create = client.post("/api/jobs", headers=auth_headers, json={
        "title": "Get By ID Job",
        "company": "Corp",
        "skills": ["React"],
    })
    job_id = create.json()["id"]

    res = client.get(f"/api/jobs/{job_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == job_id


def test_get_job_not_found(client, auth_headers):
    res = client.get("/api/jobs/nonexistent-job-id", headers=auth_headers)
    assert res.status_code == 404


def test_patch_job(client, auth_headers):
    create = client.post("/api/jobs", headers=auth_headers, json={
        "title": "Patch Job",
        "company": "Corp",
        "skills": ["Vue"],
    })
    job_id = create.json()["id"]

    patch = client.patch(f"/api/jobs/{job_id}", headers=auth_headers, json={
        "title": "Patched Job Title",
        "status": "closed",
    })
    assert patch.status_code == 200
    assert patch.json()["title"] == "Patched Job Title"


def test_delete_job(client, auth_headers):
    create = client.post("/api/jobs", headers=auth_headers, json={
        "title": "Delete Job",
        "company": "Corp",
        "skills": [],
    })
    job_id = create.json()["id"]

    delete = client.delete(f"/api/jobs/{job_id}", headers=auth_headers)
    assert delete.status_code == 200

    get = client.get(f"/api/jobs/{job_id}", headers=auth_headers)
    assert get.status_code == 404


def test_jobs_require_auth(client):
    res = client.get("/api/jobs")
    assert res.status_code == 401
