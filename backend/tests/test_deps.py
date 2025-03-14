import pytest
from fastapi import HTTPException
from unittest.mock import patch, MagicMock
from app.api.deps import get_current_user, get_current_admin, get_current_doctor, get_current_patient
import pytest_asyncio
import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.mark.asyncio
async def test_get_current_user_success():
    # Mock the token verification and database response
    with patch('app.utils.security.security.verify_token') as mock_verify, \
         patch('app.api.deps.db.get_db') as mock_db:
        
        # Setup mocks
        mock_verify.return_value = {"sub": "1"}
        
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock user query
        mock_cursor.fetchone.return_value = {
            "user_id": 1,
            "email": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "role_id": 1,
            "role_name": "admin"
        }
        
        # Test get_current_user
        user = await get_current_user("test_token")
        
        assert user["user_id"] == 1
        assert user["email"] == "test@example.com"
        assert user["role_name"] == "admin"

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    # Mock the token verification
    with patch('app.utils.security.security.verify_token') as mock_verify:
        
        # Setup mocks
        mock_verify.return_value = None
        
        # Test get_current_user with invalid token
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user("invalid_token")
        
        assert excinfo.value.status_code == 401
        assert "Invalid authentication credentials" in excinfo.value.detail

@pytest.mark.asyncio
async def test_get_current_user_not_found():
    # Mock the token verification and database response
    with patch('app.utils.security.security.verify_token') as mock_verify, \
         patch('app.api.deps.db.get_db') as mock_db:
        
        # Setup mocks
        mock_verify.return_value = {"sub": "999"}
        
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock user query (user not found)
        mock_cursor.fetchone.return_value = None
        
        # Test get_current_user with non-existent user
        with pytest.raises(HTTPException) as excinfo:
            await get_current_user("test_token")
        
        assert excinfo.value.status_code == 404
        assert "User not found" in excinfo.value.detail

@pytest.mark.asyncio
async def test_get_current_admin_success():
    # Mock the get_current_user dependency
    current_user = {
        "user_id": 1,
        "email": "admin@example.com",
        "role_name": "admin"
    }
    
    # Test get current admin
    admin = await get_current_admin(current_user)
    
    assert admin["user_id"] == 1
    assert admin["role_name"] == "admin"

@pytest.mark.asyncio
async def test_get_current_admin_not_admin():
    # Mock the get_current_user dependency
    current_user = {
        "user_id": 2,
        "email": "doctor@example.com",
        "role_name": "doctor"
    }
    
    # Test get current admin with non-admin user
    with pytest.raises(HTTPException) as excinfo:
        await get_current_admin(current_user)
    
    assert excinfo.value.status_code == 403
    assert "Not enough permissions" in excinfo.value.detail

@pytest.mark.asyncio
async def test_get_current_doctor_success():
    # Mock the get_current_user dependency and database response
    with patch('app.api.deps.db.get_db') as mock_db:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock doctor query
        mock_cursor.fetchone.return_value = {
            "doctor_id": 1
        }
        
        # Mock current user
        current_user = {
            "user_id": 2,
            "email": "doctor@example.com",
            "first_name": "Doctor",
            "last_name": "User",
            "role_id": 2,
            "role_name": "doctor"
        }
        
        # Test get_current_doctor
        doctor = await get_current_doctor(current_user)
        
        assert doctor["doctor_id"] == 1

@pytest.mark.asyncio
async def test_get_current_doctor_not_doctor():
    # Mock the current user
    current_user = {
        "user_id": 3,
        "email": "patient@example.com",
        "first_name": "Patient",
        "last_name": "User",
        "role_id": 3,
        "role_name": "patient"
    }
    
    # Test get_current_doctor with non-doctor user
    with pytest.raises(HTTPException) as excinfo:
        await get_current_doctor(current_user)
    
    assert excinfo.value.status_code == 403
    assert "Not authorized to access this resource" in excinfo.value.detail

@pytest.mark.asyncio
async def test_get_current_patient_success():
    # Mock the get_current_user dependency and database response
    with patch('app.api.deps.db.get_db') as mock_db:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock patient query
        mock_cursor.fetchone.return_value = {
            "patient_id": 1
        }
        
        # Mock current user
        current_user = {
            "user_id": 3,
            "email": "patient@example.com",
            "first_name": "Patient",
            "last_name": "User",
            "role_id": 3,
            "role_name": "patient"
        }
        
        # Test get_current_patient
        patient = await get_current_patient(current_user)
        
        assert patient["patient_id"] == 1

@pytest.mark.asyncio
async def test_get_current_patient_not_patient():
    # Mock the current user
    current_user = {
        "user_id": 2,
        "email": "doctor@example.com",
        "first_name": "Doctor",
        "last_name": "User",
        "role_id": 2,
        "role_name": "doctor"
    }
    
    # Test get_current_patient with non-patient user
    with pytest.raises(HTTPException) as excinfo:
        await get_current_patient(current_user)
    
    assert excinfo.value.status_code == 403
    assert "Not authorized to access this resource" in excinfo.value.detail 