import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

# Helper function to get auth headers
def get_auth_headers(role="admin"):
    if role == "admin":
        return {"Authorization": "Bearer admin_token"}
    elif role == "doctor":
        return {"Authorization": "Bearer doctor_token"}
    elif role == "patient":
        return {"Authorization": "Bearer patient_token"}
    return {"Authorization": "Bearer test_token"}

def test_create_medical_record(test_client):
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
                "email": "doctor@example.com",
                "first_name": "Doctor",
                "last_name": "User",
                "role_id": 2,
                "role_name": "doctor"
            },
            {
                "doctor_id": 1
            }
        ]
        
        # Mock cursor.lastrowid
        mock_cursor.lastrowid = 1
        
        # Test create medical record
        record_data = {
            "patient_id": 1,
            "diagnosis": "Hypertension",
            "treatment": "Prescribed lisinopril 10mg daily",
            "notes": "Patient should monitor blood pressure daily"
        }
        
        response = test_client.post(
            "/api/v1/medical-records",
            json=record_data,
            headers=get_auth_headers("doctor")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["record_id"] == 1

def test_get_medical_record(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db, \
         patch('app.utils.security.security.verify_token') as mock_verify:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock token verification
        mock_verify.return_value = {"sub": "1"}
        
        # Mock user query for auth and record data
        mock_cursor.fetchone.side_effect = [
            {
                "user_id": 1,
                "email": "doctor@example.com",
                "first_name": "Doctor",
                "last_name": "User",
                "role_id": 2,
                "role_name": "doctor"
            },
            {
                "record_id": 1,
                "patient_id": 2,
                "doctor_id": 1,
                "diagnosis": "Hypertension",
                "treatment": "Prescribed lisinopril 10mg daily",
                "notes": "Patient should monitor blood pressure daily",
                "created_at": datetime(2023, 1, 1, 12, 0, 0),
                "updated_at": datetime(2023, 1, 1, 12, 0, 0),
                "doctor_first_name": "John",
                "doctor_last_name": "Smith",
                "patient_first_name": "Jane",
                "patient_last_name": "Doe"
            }
        ]
        
        # Test get medical record
        response = test_client.get(
            "/api/v1/medical-records/1",
            headers=get_auth_headers("doctor")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["record_id"] == 1
        assert data["diagnosis"] == "Hypertension"
        assert data["doctor"]["first_name"] == "John"
        assert data["patient"]["first_name"] == "Jane"

def test_get_patient_medical_records(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db, \
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
        mock_cursor.fetchone.return_value = {
            "user_id": 1,
            "email": "patient@example.com",
            "first_name": "Patient",
            "last_name": "User",
            "role_id": 3,
            "role_name": "patient"
        }
        
        # Mock records
        mock_cursor.fetchall.return_value = [
            {
                "record_id": 1,
                "patient_id": 1,
                "doctor_id": 1,
                "diagnosis": "Hypertension",
                "treatment": "Prescribed lisinopril 10mg daily",
                "notes": "Patient should monitor blood pressure daily",
                "created_at": datetime.now() - timedelta(days=10),
                "updated_at": datetime.now() - timedelta(days=10),
                "doctor_first_name": "Doctor",
                "doctor_last_name": "One"
            },
            {
                "record_id": 2,
                "patient_id": 1,
                "doctor_id": 2,
                "diagnosis": "Common Cold",
                "treatment": "Rest and fluids",
                "notes": "Follow up in 1 week if symptoms persist",
                "created_at": datetime.now() - timedelta(days=5),
                "updated_at": datetime.now() - timedelta(days=5),
                "doctor_first_name": "Doctor",
                "doctor_last_name": "Two"
            }
        ]
        
        # Test get patient medical records
        response = test_client.get(
            "/api/v1/medical-records/patient/1",
            headers=get_auth_headers("patient")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["diagnosis"] == "Hypertension"
        assert data[1]["diagnosis"] == "Common Cold"

def test_update_medical_record(test_client):
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
                "email": "doctor@example.com",
                "first_name": "Doctor",
                "last_name": "User",
                "role_id": 2,
                "role_name": "doctor"
            },
            {
                "doctor_id": 1
            },
            {
                "record_id": 1,
                "doctor_id": 1,
                "patient_id": 2,
                "diagnosis": "Hypertension",
                "treatment": "Prescribed lisinopril 10mg daily",
                "notes": "Patient should monitor blood pressure daily"
            }
        ]
        
        # Test update medical record
        update_data = {
            "diagnosis": "Hypertension Stage 1",
            "treatment": "Increased lisinopril to 20mg daily",
            "notes": "Patient should monitor blood pressure twice daily"
        }
        
        response = test_client.put(
            "/api/v1/medical-records/1",
            json=update_data,
            headers=get_auth_headers("doctor")
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Medical record updated successfully" 