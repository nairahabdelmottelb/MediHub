import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock

@pytest.fixture
def test_client():
    return TestClient(app)

@pytest.fixture
def mock_db():
    with patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.config.database.db.transaction') as mock_transaction:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        mock_transaction.return_value = mock_conn
        
        yield mock_cursor

@pytest.fixture
def mock_auth():
    with patch('app.utils.security.security.verify_token') as mock_verify:
        # Mock token verification
        mock_verify.return_value = {"sub": "1"}
        yield mock_verify

# Debug function to print all registered routes
@pytest.fixture(scope="session", autouse=True)
def print_app_routes():
    print("\nRegistered routes:")
    for route in app.routes:
        print(f"{route.path} - {route.methods}")
    
    # Also print all routes from the API router
    from app.api.api import api_router
    print("\nAPI router routes:")
    for route in api_router.routes:
        print(f"/api/v1{route.path} - {route.methods}")
    
    # Print all routes from the appointments router
    from app.api.endpoints import appointments
    print("\nAppointments router routes:")
    for route in appointments.router.routes:
        print(f"/api/v1/appointments{route.path} - {route.methods}")


@pytest.fixture
def admin_token(test_client):
    response = test_client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    if response.status_code != 200:
        print(f"Login failed with status code: {response.status_code}")
        print(f"Response: {response.json()}")
        return None
    return response.json()["access_token"]