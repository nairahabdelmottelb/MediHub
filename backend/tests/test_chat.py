import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def get_auth_headers(user_type="admin"):
    """Helper function to get auth headers for different user types"""
    return {"Authorization": f"Bearer {user_type}_token"}

def test_send_message():
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.config.database.db.transaction') as mock_transaction, \
         patch('app.utils.security.security.verify_token') as mock_verify_token:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        mock_transaction.return_value = mock_conn
        
        # Mock token verification
        mock_verify_token.return_value = {"sub": "1"}
        
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
                "user_id": 2
            }  # Recipient exists
        ]
        
        # Mock lastrowid
        mock_cursor.lastrowid = 1
        
        # Test send message
        response = client.post(
            "/api/v1/chat/send",
            json={
                "recipient_id": 2,
                "content": "Hello, how are you?"
            },
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        assert response.json()["message_id"] == 1
        assert response.json()["sender_id"] == 1
        assert response.json()["recipient_id"] == 2
        assert response.json()["content"] == "Hello, how are you?"
        assert "created_at" in response.json()
        assert response.json()["is_read"] == False

def test_get_messages():
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.config.database.db.transaction') as mock_transaction, \
         patch('app.utils.security.security.verify_token') as mock_verify_token:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        mock_transaction.return_value = mock_conn
        
        # Mock token verification
        mock_verify_token.return_value = {"sub": "1"}
        
        # Mock user query for auth
        mock_cursor.fetchone.return_value = {
            "user_id": 1,
            "email": "admin@example.com",
            "first_name": "Admin",
            "last_name": "User",
            "role_id": 1,
            "role_name": "admin"
        }
        
        # Mock messages query
        mock_cursor.fetchall.return_value = [
            {
                "message_id": 1,
                "sender_id": 1,
                "recipient_id": 2,
                "content": "Hello, how are you?",
                "created_at": "2023-01-01T10:00:00",
                "is_read": True
            },
            {
                "message_id": 2,
                "sender_id": 2,
                "recipient_id": 1,
                "content": "I'm good, thanks!",
                "created_at": "2023-01-01T10:05:00",
                "is_read": False
            }
        ]
        
        # Test get messages
        response = client.get(
            "/api/v1/chat/messages/2",
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert response.json()[0]["message_id"] == 1
        assert response.json()[1]["message_id"] == 2

def test_get_conversation():
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify_token:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        
        # Mock token verification
        mock_verify_token.return_value = {"sub": "1"}
        
        # Mock user query for auth
        mock_cursor.fetchone.return_value = {
            "user_id": 1,
            "email": "admin@example.com",
            "first_name": "Admin",
            "last_name": "User",
            "role_id": 1,
            "role_name": "admin"
        }
        
        # Mock conversations query
        mock_cursor.fetchall.return_value = [
            {
                "user_id": 2,
                "first_name": "Doctor",
                "last_name": "User",
                "email": "doctor@example.com",
                "last_message": "I'm good, thanks!",
                "last_message_time": "2023-01-01T10:05:00",
                "unread_count": 1
            },
            {
                "user_id": 3,
                "first_name": "Patient",
                "last_name": "User",
                "email": "patient@example.com",
                "last_message": "When is my next appointment?",
                "last_message_time": "2023-01-01T09:00:00",
                "unread_count": 0
            }
        ]
        
        # Test get conversations
        response = client.get(
            "/api/v1/chat/conversations",
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert response.json()[0]["user_id"] == 2
        assert response.json()[1]["user_id"] == 3

def test_get_unread_count():
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify_token:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_get_db.return_value = mock_conn
        
        # Mock token verification
        mock_verify_token.return_value = {"sub": "1"}
        
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
                "count": 3
            }
        ]
        
        # Test get unread count
        response = client.get(
            "/api/v1/chat/unread",
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        assert response.json()["count"] == 3 