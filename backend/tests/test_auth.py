import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from unittest.mock import patch, MagicMock

def test_login_success(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db, \
         patch('app.utils.security.security.verify_password') as mock_verify_password, \
         patch('app.utils.security.security.create_access_token') as mock_create_token:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock password verification
        mock_verify_password.return_value = True
        
        # Mock token creation
        mock_create_token.return_value = "test_token"
        
        # Mock user query
        mock_cursor.fetchone.return_value = {
            "user_id": 1,
            "email": "admin@example.com",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "password" hashed with bcrypt
            "first_name": "Admin",
            "last_name": "User",
            "role_id": 1,
            "role_name": "admin"
        }
        
        # Test login
        response = test_client.post(
            "/api/v1/auth/login",
            data={"username": "admin@example.com", "password": "password123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["access_token"] == "test_token"
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["user_id"] == 1
        assert data["user"]["email"] == "admin@example.com"
        assert "password" not in data["user"]

def test_login_json_success(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db, \
         patch('app.utils.security.security.verify_password') as mock_verify_password, \
         patch('app.utils.security.security.create_access_token') as mock_create_token:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock password verification
        mock_verify_password.return_value = True
        
        # Mock token creation
        mock_create_token.return_value = "test_token"
        
        # Mock user query
        mock_cursor.fetchone.return_value = {
            "user_id": 1,
            "email": "admin@example.com",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "password" hashed with bcrypt
            "first_name": "Admin",
            "last_name": "User",
            "role_id": 1,
            "role_name": "admin"
        }
        
        # Test login with JSON
        response = test_client.post(
            "/api/v1/auth/login/json",
            json={"email": "admin@example.com", "password": "password123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["access_token"] == "test_token"
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["user_id"] == 1
        assert data["user"]["email"] == "admin@example.com"
        assert "password" not in data["user"]

def test_login_invalid_credentials(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db, \
         patch('app.utils.security.security.verify_password') as mock_verify_password:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock password verification
        mock_verify_password.return_value = False
        
        # Mock user query
        mock_cursor.fetchone.return_value = {
            "user_id": 1,
            "email": "admin@example.com",
            "password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "password" hashed with bcrypt
            "first_name": "Admin",
            "last_name": "User",
            "role_id": 1,
            "role_name": "admin"
        }
        
        # Test login with invalid password
        response = test_client.post(
            "/api/v1/auth/login",
            data={"username": "admin@example.com", "password": "wrong_password"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Incorrect email or password" in data["detail"]

def test_login_user_not_found(test_client):
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_db:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_db.return_value = mock_conn
        
        # Mock user query (user not found)
        mock_cursor.fetchone.return_value = None
        
        # Test login with non-existent user
        response = test_client.post(
            "/api/v1/auth/login",
            data={"username": "nonexistent@example.com", "password": "password123"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        assert "Incorrect email or password" in data["detail"] 