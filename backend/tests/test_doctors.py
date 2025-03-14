import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, time

# Helper function to get auth headers
def get_auth_headers(user_type="admin"):
    """Helper function to get auth headers for different user types"""
    return {"Authorization": f"Bearer {user_type}_token"}

def test_get_doctors(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db, \
         patch('app.api.deps.db.get_db') as mock_deps_db:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        mock_deps_db.return_value = mock_conn
        
        # Mock doctors list
        mock_cursor.fetchall.return_value = [
            {
                "doctor_id": 1,
                "first_name": "John",
                "last_name": "Smith",
                "email": "john.smith@example.com",
                "phone": "1234567890",
                "years_of_exp": 10,
                "spec_id": 1,
                "spec_name": "Cardiologist",
                "department_id": 1,
                "department_name": "Cardiology"
            },
            {
                "doctor_id": 2,
                "first_name": "Jane",
                "last_name": "Doe",
                "email": "jane.doe@example.com",
                "phone": "0987654321",
                "years_of_exp": 8,
                "spec_id": 2,
                "spec_name": "Neurologist",
                "department_id": 2,
                "department_name": "Neurology"
            }
        ]
        
        # Test get doctors
        response = test_client.get("/api/v1/doctors/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["doctor_id"] == 1
        assert data[0]["first_name"] == "John"
        assert data[0]["spec_name"] == "Cardiologist"
        assert data[1]["doctor_id"] == 2
        assert data[1]["first_name"] == "Jane"
        assert data[1]["spec_name"] == "Neurologist"

def test_get_doctor(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db, \
         patch('app.api.deps.db.get_db') as mock_deps_db:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        mock_deps_db.return_value = mock_conn
        
        # Mock the database response for doctor details
        mock_cursor.fetchone.side_effect = [
            {
                "doctor_id": 1,
                "user_id": 2,
                "first_name": "John",
                "last_name": "Doe",
                "email": "john.doe@example.com",
                "phone": "1234567890",
                "license_number": "MD12345",
                "spec_id": 1,
                "spec_name": "Cardiologist",
                "department_id": 1,
                "department_name": "Cardiology Department",
                "years_of_exp": 10,
                "created_at": datetime(2023, 1, 1),
                "updated_at": datetime(2023, 1, 1)
            }
        ]
        
        # Mock schedule
        mock_cursor.fetchall.return_value = [
            {
                "timeslot_id": 1,
                "day_of_week": 1,
                "start_time": time(9, 0),
                "end_time": time(17, 0),
                "is_available": True
            }
        ]
        
        # Test get doctor
        response = test_client.get("/api/v1/doctors/1/")
        
        print(f"\nResponse status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["doctor_id"] == 1
        assert data["first_name"] == "John"
        assert data["spec_name"] == "Cardiologist"
        assert len(data["schedule"]) > 0
        assert data["schedule"][0]["day_of_week"] == 1

def test_create_doctor_schedule(test_client):
    # Mock the database response
    with patch('app.config.database.db.transaction') as mock_db, \
         patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify, \
         patch('app.api.deps.db.get_db') as mock_deps_db:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        mock_get_db.return_value = mock_conn
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
                "doctor_id": 1
            }
        ]
        
        # Mock cursor.lastrowid
        mock_cursor.lastrowid = 1
        
        # Test create doctor schedule
        schedule_data = {
            "day_of_week": 1,
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "is_available": True
        }
        
        # Print all registered routes for debugging
        print("\nRegistered routes in test_create_doctor_schedule:")
        for route in app.routes:
            print(f"{route.path} - {route.methods}")
        
        response = test_client.post(
            "/api/v1/doctors/1/schedule",
            json=schedule_data,
            headers=get_auth_headers("admin")
        )
        
        print(f"\nResponse status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Schedule created successfully"