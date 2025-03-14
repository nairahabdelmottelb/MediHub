import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, ANY
from app.main import app
import importlib

# Import the signup module to inspect it
from app.api.endpoints import signup

client = TestClient(app)

def test_signup_with_db_mock():
    # Print the actual module path for debugging
    print("\nChecking security module import in signup.py:")
    for name, value in signup.__dict__.items():
        if "security" in str(value) or "hash" in str(value).lower():
            print(f"  {name}: {value}")
    
    # Try to find the correct import path for the password hashing function
    try:
        from app.utils.security import get_password_hash
        security_module = "app.utils.security"
    except ImportError:
        try:
            from app.utils.security import get_password_hash
            security_module = "app.security"
        except ImportError:
            # Default to the path we were using before
            security_module = "app.utils.security"
    
    print(f"\nUsing security module path: {security_module}")
    
    # Mock the database connection
    with patch('app.config.database.db.get_db') as mock_get_db:
        # Setup mock cursor and connection
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        
        # Mock the password hashing function
        with patch('app.utils.security.get_password_hash') as mock_hash:
            mock_hash.return_value = "hashed_password"
            
            # Setup the mock responses
            # First, email check returns None (email doesn't exist)
            mock_cursor.fetchone.side_effect = [None]
            
            # Set up lastrowid to return 101 (the user_id)
            mock_cursor.lastrowid = 101
            
            # Test data
            signup_data = {
                "email": "newuser@example.com",
                "password": "securepassword",
                "first_name": "New",
                "last_name": "User",
                "contact_number": "123-456-7890"
            }
            
            # Make the request
            response = client.post(
                "/api/v1/signup/",
                json=signup_data
            )
            
            # Print the actual calls for debugging
            print("\nActual execute calls:")
            for i, c in enumerate(mock_cursor.execute.call_args_list):
                print(f"Call {i}:")
                print(f"  SQL: {c[0][0]}")
                print(f"  Params: {c[0][1]}")
            
            # Assertions
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == 101
            assert data["email"] == "newuser@example.com"
            assert "message" in data
            
            # Verify database operations
            assert len(mock_cursor.execute.call_args_list) >= 2, "Expected at least 2 database calls"
            
            # First call should be to check if email exists
            first_call = mock_cursor.execute.call_args_list[0]
            assert "newuser@example.com" in first_call[0][1], "First call should check if email exists"
            
            # Second call should be the INSERT
            second_call = mock_cursor.execute.call_args_list[1]
            params = second_call[0][1]
            
            # Check that the INSERT has the right number of parameters
            assert len(params) >= 5, f"INSERT should have at least 5 parameters, got {len(params)}"
            
            # Check that the email is in the parameters (this should definitely be true)
            assert "newuser@example.com" in params, "Email not found in INSERT params"

def test_signup_existing_email():
    # Mock the database connection
    with patch('app.config.database.db.get_db') as mock_get_db:
        # Setup mock cursor and connection
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        
        # Setup the mock response - email already exists
        mock_cursor.fetchone.return_value = {"user_id": 100}
        
        # Test data
        signup_data = {
            "email": "existing@example.com",
            "password": "securepassword",
            "first_name": "Existing",
            "last_name": "User",
            "contact_number": "123-456-7890"
        }
        
        # Make the request
        response = client.post(
            "/api/v1/signup/",
            json=signup_data
        )
        
        # Assertions
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert data["detail"] == "Email already registered"
        
        # Verify the database call - use ANY for the SQL query
        mock_cursor.execute.assert_called_once_with(
            ANY,  # Use ANY for the SQL query
            ("existing@example.com",)
        ) 