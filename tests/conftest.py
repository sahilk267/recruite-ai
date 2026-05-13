import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.main import app, Base, get_db, UserModel, OrganizationModel, hash_password
import uuid

TEST_DB = "sqlite:///./test_recruiteai.db"
test_engine = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def client():
    # seed a test user
    db = TestSessionLocal()
    if db.query(UserModel).filter(UserModel.email == "test@recruiteai.com").first() is None:
        db.add(UserModel(
            id=str(uuid.uuid4()),
            name="Test Admin",
            email="test@recruiteai.com",
            password_hash=hash_password("testpass123"),
            role="admin",
        ))
        db.commit()
    # seed a default org so /api/org and /api/subscription/upgrade work
    if db.query(OrganizationModel).count() == 0:
        db.add(OrganizationModel(
            id=str(uuid.uuid4()),
            name="Test Org",
            slug="test-org",
            plan="free",
            ai_calls_limit=50,
        ))
        db.commit()
    db.close()
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def auth_headers(client):
    res = client.post("/api/auth/login", json={"email": "test@recruiteai.com", "password": "testpass123"})
    token = res.json()["token"]
    return {"Authorization": f"Bearer {token}"}
