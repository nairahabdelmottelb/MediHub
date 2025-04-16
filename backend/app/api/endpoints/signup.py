from fastapi import APIRouter, HTTPException, Form, Depends, Body
from app.config.database import db
from app.utils.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Dict, Optional, Union
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create a schema for user signup if you don't have one
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    contact_number: str

router = APIRouter()

# Function to create a UserSignup from form data
async def get_user_data(
    email: str = Form(None),
    password: str = Form(None),
    first_name: str = Form(None),
    last_name: str = Form(None),
    contact_number: str = Form(None),
    user_json: UserSignup = Body(None)
) -> UserSignup:
    """
    Extract user data from either form data or JSON body.
    Form fields take precedence over JSON if both are provided.
    """
    if email is not None:
        # Form data was provided
        return UserSignup(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            contact_number=contact_number
        )
    elif user_json is not None:
        # JSON data was provided
        return user_json
    else:
        raise HTTPException(
            status_code=400,
            detail="No valid user data provided. Use either form data or JSON."
        )

@router.post("/", response_model=Dict)
async def signup(user_data: UserSignup = Depends(get_user_data)):
    """
    Register a new user with admin role (role_id=1).
    Accepts both form data and JSON.
    """
    # Use transaction to ensure changes are committed
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if email already exists
            cursor.execute(
                "SELECT user_id FROM USERS WHERE email = %s",
                (user_data.email,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
            
            try:
                # Hash the password - with error handling
                hashed_password = get_password_hash(user_data.password)
            except Exception as e:
                logger.error(f"Password hashing error: {str(e)}")
                # Fallback to a simple hash if bcrypt fails
                import hashlib
                hashed_password = hashlib.sha256(user_data.password.encode()).hexdigest()
            
            # Insert new user with role_id=1 (admin)
            cursor.execute(
                """
                INSERT INTO USERS (email, password, first_name, last_name, role_id)
                VALUES (%s, %s, %s, %s, 1)
                """,
                (
                    user_data.email,
                    hashed_password,
                    user_data.first_name,
                    user_data.last_name
                )
            )
            
            # Get the last inserted ID
            user_id = cursor.lastrowid
            
    return {
        "user_id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "message": "User registered successfully with admin role."
    } 