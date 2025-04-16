from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, Body
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
    email: EmailStr
    password: str

router = APIRouter()

@router.post("/login", response_model=Dict)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(None),
    email: str = Form(None),
    password: str = Form(None),
    username: str = Form(None),
    body: dict = Body(None)
):
    """
    Login endpoint that supports multiple authentication methods:
    
    1. OAuth2 form (username field contains email)
    2. Regular form fields (email/password)
    3. Direct JSON body (email/password or username/password)
    
    Returns access token and user information.
    """
    # Determine which login method to use
    if form_data is not None:
        # OAuth2 form login
        email = form_data.username
        password = form_data.password
    elif email is not None and password is not None:
        # Regular form login with email/password
        pass
    elif username is not None and password is not None:
        # Regular form login with username/password
        email = username
    elif body is not None:
        # JSON body login
        if "email" in body:
            email = body["email"]
        elif "username" in body:
            email = body["username"]
        else:
            raise HTTPException(
                status_code=400,
                detail="JSON body must contain 'email' or 'username' field"
            )
            
        if "password" in body:
            password = body["password"]
        else:
            raise HTTPException(
                status_code=400,
                detail="JSON body must contain 'password' field"
            )
    else:
        raise HTTPException(
            status_code=400,
            detail="No valid login data provided. Use form fields or JSON body."
        )
    
    # Authenticate user
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, password, role_id FROM USERS WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()
    
    if not user or not security.verify_password(password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Generate access token
    access_token = security.create_access_token(
        data={"sub": str(user["user_id"]), "role": user["role_id"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "role_id": user["role_id"]
    }

@router.post("/login/json", response_model=Dict)
async def login_json(request_data: dict = Body(...)):
    """
    Direct JSON login endpoint that only requires email and password.
    This is a simpler alternative to the main login endpoint.
    
    Accepts either:
    - {"email": "user@example.com", "password": "yourpassword"}
    - {"username": "user@example.com", "password": "yourpassword"}
    """
    # Check if we have a username field (for compatibility)
    if "username" in request_data and "email" not in request_data:
        email = request_data["username"]
    elif "email" in request_data:
        email = request_data["email"]
    else:
        raise HTTPException(
            status_code=400,
            detail="JSON body must contain 'email' or 'username' field"
        )
    
    if "password" not in request_data:
        raise HTTPException(
            status_code=400,
            detail="JSON body must contain 'password' field"
        )
    
    password = request_data["password"]
    
    # Authenticate user
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, password, role_id FROM USERS WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()
    
    if not user or not security.verify_password(password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Generate access token
    access_token = security.create_access_token(
        data={"sub": str(user["user_id"]), "role": user["role_id"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "role_id": user["role_id"]
    }

@router.post("/json-login", response_model=Dict)
async def json_login(request_data: dict = Body(...)):
    """
    Simple JSON login endpoint.
    
    Accepts a JSON body with:
    - email or username
    - password
    
    Example:
    ```json
    {
        "email": "user@example.com",
        "password": "yourpassword"
    }
    ```
    
    Or:
    ```json
    {
        "username": "user@example.com",
        "password": "yourpassword"
    }
    ```
    
    Returns a JWT token that can be used for authentication.
    """
    # Check for email or username
    if "email" in request_data:
        email = request_data["email"]
    elif "username" in request_data:
        email = request_data["username"]
    else:
        raise HTTPException(
            status_code=400,
            detail="Missing email or username field"
        )
    
    # Check for password
    if "password" not in request_data:
        raise HTTPException(
            status_code=400,
            detail="Missing password field"
        )
    
    password = request_data["password"]
    
    # Authenticate user
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, password, role_id, first_name, last_name, email FROM USERS WHERE email = %s",
                (email,)
            )
            user = cursor.fetchone()
    
    if not user or not security.verify_password(password, user["password"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    # Generate access token
    access_token = security.create_access_token(
        data={"sub": str(user["user_id"]), "role": user["role_id"]}
    )
    
    # Return token and user info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "role_id": user["role_id"],
        "user": {
            "id": user["user_id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"]
        }
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