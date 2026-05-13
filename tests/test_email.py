"""Tests for email send + log endpoints."""
import pytest


def test_send_email(client, auth_headers):
    res = client.post("/api/email/send", headers=auth_headers, json={
        "to_email": "candidate@example.com",
        "to_name": "Test Candidate",
        "subject": "Interview Invitation",
        "body": "Hi, we'd love to interview you!",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "sent"
    assert data["to"] == "candidate@example.com"
    assert "id" in data


def test_send_email_with_variables(client, auth_headers):
    res = client.post("/api/email/send", headers=auth_headers, json={
        "to_email": "var@example.com",
        "to_name": "Var Test",
        "subject": "Hello {{name}}",
        "body": "Dear {{name}}, your score is {{score}}.",
        "variables": {"name": "Alice", "score": "85"},
    })
    assert res.status_code == 200
    data = res.json()
    assert data["subject"] == "Hello Alice"
    assert data["status"] == "sent"


def test_get_email_logs(client, auth_headers):
    # send one first
    client.post("/api/email/send", headers=auth_headers, json={
        "to_email": "logtest@example.com",
        "subject": "Log Test",
        "body": "Test body",
    })
    res = client.get("/api/email/logs", headers=auth_headers)
    assert res.status_code == 200
    logs = res.json()
    assert isinstance(logs, list)
    assert len(logs) > 0
    assert "to_email" in logs[0]
    assert "subject" in logs[0]


def test_email_stats(client, auth_headers):
    res = client.get("/api/email/stats", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total" in data
    assert "sent" in data
    assert "failed" in data


def test_email_requires_auth(client):
    res = client.post("/api/email/send", json={
        "to_email": "x@x.com", "subject": "Test", "body": "Hi"
    })
    assert res.status_code == 401
