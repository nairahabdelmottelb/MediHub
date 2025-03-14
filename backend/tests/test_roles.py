import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from unittest.mock import patch, MagicMock
from datetime import datetime

# Helper function to get auth headers
def get_auth_headers(user_type="admin"):
    """Helper function to get auth headers for different user types"""
    return {"Authorization": f"Bearer {user_type}_token"}

@pytest.fixture
def role_data():
    return [
        {
            "role_name": "receptionist",
            "description": "Front desk staff"
        },
        {
            "role_name": "nurse",
            "description": "Nursing staff"
        },
        {
            "role_name": "technician",
            "description": "Lab technician"
        }
    ]

def test_create_role(test_client):
    # Mock the database response
    with patch('app.config.database.db.transaction') as mock_db, \
         patch('app.utils.security.security.verify_token') as mock_verify, \
         patch('app.api.deps.db.get_db') as mock_deps_db:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        mock_deps_db.return_value = mock_conn
        
        # Mock token verification
        mock_verify.return_value = {"sub": "1"}
        
        # Mock user query for auth
        mock_cursor.fetchone.side_effect = [
            {
                "user_id": 1,
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "role_id": 1,
                "role_name": "admin"
            },
            {
                "role_id": 3,
                "role_name": "nurse",
                "description": "Nursing staff",
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 1)
            }
        ]
        
        # Mock cursor.lastrowid
        mock_cursor.lastrowid = 3
        
        # Test create role
        role_data = {
            "role_name": "nurse",
            "description": "Nursing staff"
        }
        
        response = test_client.post(
            "/api/v1/roles",
            json=role_data,
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["role_id"] == 3
        assert data["role_name"] == "nurse"
        assert "created_at" in data
        assert "updated_at" in data
        assert "users" in data

def test_get_roles(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db:
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock the database response
        mock_cursor.fetchall.return_value = [
            {
                "role_id": 1,
                "role_name": "admin",
                "description": "Administrator",
                "user_count": 2
            },
            {
                "role_id": 2,
                "role_name": "doctor",
                "description": "Medical doctor",
                "user_count": 5
            },
            {
                "role_id": 3,
                "role_name": "patient",
                "description": "Patient",
                "user_count": 10
            }
        ]
        
        # Test get roles
        response = test_client.get("/api/v1/roles")
        
        assert response.status_code == 200
        assert len(response.json()) == 3
        assert response.json()[0]["role_name"] == "admin"
        assert response.json()[1]["role_name"] == "doctor"
        assert response.json()[2]["role_name"] == "patient"

def test_get_role(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db:
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock the database response
        mock_cursor.fetchone.return_value = {
            "role_id": 1,
            "role_name": "admin",
            "description": "Administrator",
            "created_at": datetime(2023, 1, 1),
            "updated_at": datetime(2023, 1, 1)
        }
        
        # Mock users with role
        mock_cursor.fetchall.return_value = [
            {
                "user_id": 1,
                "email": "admin1@example.com",
                "first_name": "Admin",
                "last_name": "One",
                "phone": "1234567890",
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 1)
            },
            {
                "user_id": 2,
                "email": "admin2@example.com",
                "first_name": "Admin",
                "last_name": "Two",
                "phone": "0987654321",
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 1)
            }
        ]
        
        # Test get role
        response = test_client.get("/api/v1/roles/1")
        
        assert response.status_code == 200
        assert response.json()["role_name"] == "admin"
        assert len(response.json()["users"]) == 2
        assert response.json()["users"][0]["email"] == "admin1@example.com"

def test_update_role(test_client):
    # Mock the database response
    with patch('app.config.database.db.transaction') as mock_db, \
         patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        mock_get_db.return_value = mock_conn
        
        # Mock token verification
        mock_verify.return_value = {"sub": "1"}
        
        # Mock user query for auth
        mock_cursor.fetchone.side_effect = [
            {
                "user_id": 1,
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "role_id": 1,
                "role_name": "admin"
            },
            {
                "role_id": 3
            },
            {
                "role_id": 3,
                "role_name": "head nurse",
                "description": "Head of nursing staff",
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 2)
            }
        ]
        
        # Mock users list
        mock_cursor.fetchall.return_value = []
        
        # Test update role
        update_data = {
            "role_name": "head nurse",
            "description": "Head of nursing staff"
        }
        
        response = test_client.put(
            "/api/v1/roles/3",
            json=update_data,
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["role_name"] == "head nurse"
        assert data["description"] == "Head of nursing staff"
        assert "created_at" in data
        assert "updated_at" in data
        assert "users" in data

def test_delete_role(test_client):
    # Mock the database response
    with patch('app.config.database.db.transaction') as mock_db, \
         patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        mock_get_db.return_value = mock_conn
        
        # Mock token verification
        mock_verify.return_value = {"sub": "1"}
        
        # Mock user query for auth
        mock_cursor.fetchone.side_effect = [
            {
                "user_id": 1,
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "role_id": 1,
                "role_name": "admin"
            },
            {
                "role_id": 3
            }
        ]
        
        # Mock user check (no users)
        mock_cursor.fetchall.return_value = []
        
        # Test delete role
        response = test_client.delete(
            "/api/v1/roles/3",
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Role deleted successfully"

def test_delete_role_with_users(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        
        # Mock token verification
        mock_verify.return_value = {"sub": "1"}
        
        # Mock user query for auth and role check
        mock_cursor.fetchone.side_effect = [
            {
                "user_id": 1,
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "role_id": 1,
                "role_name": "admin"
            },
            {
                "role_id": 2,
                "role_name": "doctor",
                "description": "Doctor"
            }
        ]
        
        # Mock users check (has users)
        mock_cursor.fetchall.return_value = [
            {"user_id": 2},
            {"user_id": 3}
        ]
        
        # Test delete role with users
        response = test_client.delete(
            "/api/v1/roles/2",
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "Cannot delete role with users" in data["detail"]

def test_create_role_unauthorized(test_client):
    # Mock the database response
    with patch('app.utils.security.security.verify_token') as mock_verify:
        # Mock token verification
        mock_verify.return_value = {"sub": "2"}
        
        # Mock user query for auth
        with patch('app.api.deps.db.get_db') as mock_db:
            mock_cursor = MagicMock()
            mock_conn = MagicMock()
            mock_conn.__enter__.return_value = mock_conn
            mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
            mock_db.return_value = mock_conn
            
            mock_cursor.fetchone.return_value = {
                "user_id": 2,
                "email": "doctor@example.com",
                "first_name": "Doctor",
                "last_name": "User",
                "role_id": 2,
                "role_name": "doctor"
            }
            
            # Test create role with unauthorized user
            role_data = {
                "role_name": "nurse",
                "description": "Nursing staff"
            }
            
            response = test_client.post(
                "/api/v1/roles",
                json=role_data,
                headers=get_auth_headers("doctor")
            )
            
            assert response.status_code == 403
            data = response.json()
            assert data["detail"] == "Not authorized to create roles" 