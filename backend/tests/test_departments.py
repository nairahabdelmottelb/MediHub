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

def test_create_department(test_client):
    # Mock the database response
    with patch('app.config.database.db.transaction') as mock_db, \
         patch('app.utils.security.security.verify_token') as mock_verify, \
         patch('app.api.deps.db.get_db') as mock_get_db:
        
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
                "department_id": 1,
                "department_name": "Cardiology",
                "description": "Heart department",
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 1)
            }
        ]
        
        # Mock cursor.lastrowid
        mock_cursor.lastrowid = 1
        
        # Test create department
        dept_data = {
            "department_name": "Cardiology",
            "description": "Heart department"
        }
        
        # Print all registered routes for debugging
        print("\nRegistered routes in test_create_department:")
        for route in app.routes:
            print(f"{route.path} - {route.methods}")
        
        response = test_client.post(
            "/api/v1/departments",
            json=dept_data,
            headers=get_auth_headers("admin")
        )
        
        print(f"\nResponse status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 201
        data = response.json()
        assert data["department_id"] == 1
        assert data["department_name"] == "Cardiology"
        assert "created_at" in data
        assert "updated_at" in data
        assert "doctors" in data

def test_get_departments(test_client):
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
                "department_id": 1,
                "department_name": "Cardiology",
                "description": "Heart department",
                "doctor_count": 5
            },
            {
                "department_id": 2,
                "department_name": "Neurology",
                "description": "Brain department",
                "doctor_count": 3
            }
        ]
        
        # Test get departments
        response = test_client.get("/api/v1/departments")
        
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert response.json()[0]["department_name"] == "Cardiology"
        assert response.json()[1]["department_name"] == "Neurology"

def test_get_department(test_client):
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
            "department_id": 1,
            "department_name": "Cardiology",
            "description": "Heart department",
            "created_at": datetime(2023, 1, 1),
            "updated_at": datetime(2023, 1, 1)
        }
        
        # Mock doctors list
        mock_cursor.fetchall.return_value = [
            {
                "doctor_id": 1,
                "user_id": 2,
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "license_number": "MD12345",
                "spec_id": 1,
                "specialization_name": "Cardiologist"
            }
        ]
        
        # Test get department
        response = test_client.get("/api/v1/departments/1")
        
        assert response.status_code == 200
        assert response.json()["department_name"] == "Cardiology"
        assert len(response.json()["doctors"]) == 1
        assert response.json()["doctors"][0]["first_name"] == "John"

def test_update_department(test_client):
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
                "department_id": 1,
                "department_name": "Cardiology",
                "description": "Heart department",
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 1)
            },
            {
                "department_id": 1,
                "department_name": "Cardiology Department",
                "description": "Heart and blood vessel department",
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 2)
            }
        ]
        
        # Mock doctors list
        mock_cursor.fetchall.return_value = []
        
        # Test update department
        update_data = {
            "department_name": "Cardiology Department",
            "description": "Heart and blood vessel department"
        }
        
        response = test_client.put(
            "/api/v1/departments/1",
            json=update_data,
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["department_name"] == "Cardiology Department"
        assert data["description"] == "Heart and blood vessel department"
        assert "created_at" in data
        assert "updated_at" in data
        assert "doctors" in data

def test_delete_department(test_client):
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
                "department_id": 1
            }
        ]
        
        # Mock doctor check (no doctors)
        mock_cursor.fetchall.return_value = []
        
        # Test delete department
        response = test_client.delete(
            "/api/v1/departments/1",
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Department deleted successfully" 