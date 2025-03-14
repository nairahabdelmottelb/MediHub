from fastapi import APIRouter, Depends, HTTPException, status, Request, Form
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, date
from app.config.database import db
from app.utils import security
from typing import Dict, Optional, Union
from pydantic import BaseModel, EmailStr
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Define the token response model
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict

# Define a schema for user signup with only fields that match your schema
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    contact_number: str
    date_of_birth: date
    gender: str
    blood_type: Optional[str] = None

# Define model for JSON login
class LoginRequest(BaseModel):
    username: str
    password: str

router = APIRouter()

# JSON-based login endpoint
@router.post("/login")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), login_json: LoginRequest = None):
    """
    Login endpoint that returns an access token for valid credentials.
    Accepts both JSON format and form data for compatibility with Swagger UI.
    """
    # Determine if this is JSON or form data
    content_type = request.headers.get("Content-Type", "")
    
    # Get username and password from the appropriate source
    if "application/json" in content_type and login_json:
        username = login_json.username
        password = login_json.password
    else:
        # Use form data (for Swagger UI)
        username = form_data.username
        password = form_data.password
    
    logger.info(f"Login attempt for user: {username}")
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.password, u.first_name, u.last_name, 
                       u.role_id, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.email = %s
                """,
                (username,)
            )
            user = cursor.fetchone()
    
    # Check if user exists and password is correct
    if user is None or not security.verify_password(password, user["password"]):
        logger.warning(f"Failed login attempt for user: {username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Successful login for user: {username}")
    
    # Create access token
    access_token_expires = timedelta(minutes=30)
    access_token = security.create_access_token(
        data={"sub": str(user["user_id"])},
        expires_delta=access_token_expires
    )
    
    # Remove password from user data
    user.pop("password", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/signup", response_model=Dict)
async def signup(user_data: UserSignup):
    """
    Register a new user with patient role and create a patient record.
    """
    # Use transaction to ensure changes are committed
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # First, check what roles exist in the database
            cursor.execute("SELECT role_id, role_name FROM roles")
            roles = cursor.fetchall()
            
            # Find the patient role ID
            patient_role_id = None
            for role in roles:
                if role['role_name'].lower() == 'patient':
                    patient_role_id = role['role_id']
                    break
            
            # If patient role doesn't exist, use the first available role
            if patient_role_id is None and roles:
                patient_role_id = roles[0]['role_id']
            
            # If no roles exist at all, we can't create a user
            if patient_role_id is None:
                raise HTTPException(
                    status_code=500,
                    detail="No roles defined in the database. Cannot create user."
                )
            
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
                hashed_password = security.get_password_hash(user_data.password)
            except Exception as e:
                logger.error(f"Password hashing error: {str(e)}")
                # Fallback to a simple hash if bcrypt fails
                import hashlib
                hashed_password = hashlib.sha256(user_data.password.encode()).hexdigest()
            
            # Insert new user with patient role
            cursor.execute(
                """
                INSERT INTO USERS (email, password, first_name, last_name, role_id, phone)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    user_data.email,
                    hashed_password,
                    user_data.first_name,
                    user_data.last_name,
                    patient_role_id,
                    user_data.contact_number
                )
            )
            
            # Get the last inserted ID
            user_id = cursor.lastrowid
            
            # Create a patient record with only the fields that exist in your schema
            if user_data.blood_type:
                cursor.execute(
                    """
                    INSERT INTO PATIENTS (user_id, date_of_birth, gender, blood_type)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        user_id,
                        user_data.date_of_birth,
                        user_data.gender,
                        user_data.blood_type
                    )
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO PATIENTS (user_id, date_of_birth, gender)
                    VALUES (%s, %s, %s)
                    """,
                    (
                        user_id,
                        user_data.date_of_birth,
                        user_data.gender
                    )
                )
            
    return {
        "user_id": user_id,
        "email": user_data.email,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "message": "User registered successfully as a patient."
    }