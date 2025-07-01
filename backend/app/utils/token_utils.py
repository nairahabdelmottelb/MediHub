"""
Utility functions for working with JWT tokens and user information.
"""
from typing import Dict, Optional
from app.utils.security import security
from app.config.database import db
import logging

logger = logging.getLogger(__name__)

def get_user_from_token(token: str) -> Optional[Dict]:
    """
    Extract complete user information from a JWT token.
    
    Args:
        token (str): The JWT token
        
    Returns:
        Dict: User information including email, name, etc.
        None: If token is invalid or user not found
    """
    try:
        # Verify and decode the token
        payload = security.verify_token(token)
        if not payload:
            logger.warning("Invalid token provided")
            return None
        
        # Extract user ID from token
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Token missing user ID")
            return None
        
        # Fetch user information from database
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT u.user_id, u.email, u.first_name, u.last_name, 
                           u.phone, u.role_id, r.role_name
                    FROM USERS u
                    JOIN ROLES r ON u.role_id = r.role_id
                    WHERE u.user_id = %s
                    """,
                    (user_id,)
                )
                user = cursor.fetchone()
        
        if not user:
            logger.warning(f"User not found for ID: {user_id}")
            return None
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "username": f"{user['first_name']} {user['last_name']}",
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "phone": user["phone"],
            "role_id": user["role_id"],
            "role_name": user["role_name"]
        }
        
    except Exception as e:
        logger.error(f"Error extracting user from token: {str(e)}")
        return None

def get_email_from_token(token: str) -> Optional[str]:
    """
    Get just the email address from a JWT token.
    
    Args:
        token (str): The JWT token
        
    Returns:
        str: User's email address
        None: If token is invalid or user not found
    """
    user = get_user_from_token(token)
    return user["email"] if user else None

def get_username_from_token(token: str) -> Optional[str]:
    """
    Get the full name (username) from a JWT token.
    
    Args:
        token (str): The JWT token
        
    Returns:
        str: User's full name
        None: If token is invalid or user not found
    """
    user = get_user_from_token(token)
    return user["username"] if user else None

def token_belongs_to_email(token: str, email: str) -> bool:
    """
    Check if a JWT token belongs to a specific email address.
    
    Args:
        token (str): The JWT token
        email (str): Email address to check
        
    Returns:
        bool: True if token belongs to the email, False otherwise
    """
    user = get_user_from_token(token)
    return user and user["email"].lower() == email.lower()

# Example usage:
if __name__ == "__main__":
    # Example token (replace with actual token)
    example_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    
    # Get complete user info
    user_info = get_user_from_token(example_token)
    if user_info:
        print(f"Email: {user_info['email']}")
        print(f"Username: {user_info['username']}")
        print(f"Role: {user_info['role_name']}")
    
    # Get just email
    email = get_email_from_token(example_token)
    print(f"Email: {email}")
    
    # Get just username
    username = get_username_from_token(example_token)
    print(f"Username: {username}")
    
    # Check if token belongs to specific email
    is_owner = token_belongs_to_email(example_token, "seth0x410@se.com")
    print(f"Token belongs to seth0x410@se.com: {is_owner}")
