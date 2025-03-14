import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def get_auth_headers(user_type="admin"):
    """Helper function to get auth headers for different user types"""
    return {"Authorization": f"Bearer {user_type}_token"}

def test_chatbot_query():
    # Mock the database response
    with patch('app.config.database.db.transaction') as mock_transaction, \
         patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify_token, \
         patch('app.services.chatbot.chatbot_service.process_query') as mock_process_query:
        
        # Setup mocks
        mock_cursor = MagicMock()
        mock_conn = MagicMock()
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
        mock_transaction.return_value = mock_conn
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
        
        # Mock process_query
        mock_process_query.return_value = {
            "query_id": 1,
            "query": "What are your opening hours?",
            "response": "Our clinic is open Monday to Friday from 8:00 AM to 6:00 PM, and Saturday from 9:00 AM to 2:00 PM.",
            "confidence": 0.9,
            "timestamp": "2023-01-01T10:00:00"
        }
        
        # Test chatbot query
        response = client.post(
            "/api/v1/chatbot",
            json={"query": "What are your opening hours?"},
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        assert response.json()["query"] == "What are your opening hours?"
        assert "response" in response.json()
        assert "confidence" in response.json()

def test_get_chatbot_history():
    # Mock the database response
    with patch('app.config.database.db.get_db') as mock_get_db, \
         patch('app.utils.security.security.verify_token') as mock_verify_token, \
         patch('app.services.chatbot.chatbot_service.get_history') as mock_get_history:
        
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
        
        # Mock get_history
        mock_get_history.return_value = [
            {
                "query_id": 1,
                "query": "What are your opening hours?",
                "response": "Our clinic is open Monday to Friday from 8:00 AM to 6:00 PM, and Saturday from 9:00 AM to 2:00 PM.",
                "confidence": 0.9,
                "timestamp": "2023-01-01T10:00:00"
            },
            {
                "query_id": 2,
                "query": "How do I schedule an appointment?",
                "response": "You can schedule an appointment through our app or by calling our reception.",
                "confidence": 0.8,
                "timestamp": "2023-01-01T10:05:00"
            }
        ]
        
        # Test get chatbot history
        response = client.get(
            "/api/v1/chatbot/history",
            headers=get_auth_headers("admin")
        )
        
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert response.json()[0]["query"] == "What are your opening hours?"
        assert response.json()[1]["query"] == "How do I schedule an appointment?" 