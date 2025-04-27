from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config.database import db
from app.utils.security import security
from typing import Dict, Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Define OAuth2 scheme for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Get the current user from the token.
    """
    payload = security.verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, 
                       u.phone, u.role_id, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.user_id = %s
                """,
                (user_id,)
            )
            user = cursor.fetchone()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

async def get_current_admin(current_user: Dict = Depends(get_current_user)):
    """
    Get the current user and verify it's an admin.
    """
    if current_user["role_name"].lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

async def get_current_doctor(current_user = Depends(get_current_user)):
    """
    Get the current doctor user.
    """
    if current_user["role_name"] != "doctor" and current_user["role_name"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    
    # Get doctor details
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT doctor_id
                FROM doctors
                WHERE user_id = %s
                """,
                (current_user["user_id"],)
            )
            doctor = cursor.fetchone()
    
    if doctor is None and current_user["role_name"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    
    # Add doctor_id to current_user if it exists
    if doctor:
        current_user["doctor_id"] = doctor["doctor_id"]
    
    return current_user

async def get_current_patient(current_user = Depends(get_current_user)):
    """
    Get the current patient user.
    """
    if current_user["role_name"] != "patient" and current_user["role_name"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    
    # Get patient details
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT patient_id
                FROM patients
                WHERE user_id = %s
                """,
                (current_user["user_id"],)
            )
            patient = cursor.fetchone()
    
    if patient is None and current_user["role_name"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    
    # Add patient_id to current_user if it exists
    if patient:
        current_user["patient_id"] = patient["patient_id"]
    
    return current_user

async def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Verify the user is active.
    """
    if not current_user.get("is_active", True):  # Default to True if not specified
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user

async def get_current_active_doctor(current_user: dict = Depends(get_current_active_user)) -> dict:
    """
    Verify the user is a doctor.
    """
    if current_user["role_name"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Operation requires doctor privileges"
        )
    
    # Get doctor details
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM doctors
                WHERE user_id = %s
                """,
                (current_user["user_id"],)
            )
            doctor = cursor.fetchone()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    current_user["doctor_id"] = doctor["doctor_id"]
    current_user["doctor_details"] = doctor
    return current_user

async def get_current_active_patient(current_user: dict = Depends(get_current_active_user)) -> dict:
    """
    Verify the user is a patient.
    """
    if current_user["role_name"] != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Operation requires patient privileges"
        )
    
    # Get patient details
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM patients
                WHERE user_id = %s
                """,
                (current_user["user_id"],)
            )
            patient = cursor.fetchone()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    current_user["patient_id"] = patient["patient_id"]
    current_user["patient_details"] = patient
    return current_user

async def get_current_management(current_user: dict = Depends(get_current_active_user)) -> dict:
    """
    Verify the user is a management staff.
    """
    if current_user["role_name"] != "management":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Operation requires management privileges"
        )
    
    # Get management details
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM management
                WHERE user_id = %s
                """,
                (current_user["user_id"],)
            )
            management = cursor.fetchone()
    
    if not management:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Management profile not found"
        )
    
    current_user["management_id"] = management["management_id"]
    current_user["management_details"] = management
    return current_user

def verify_permission(required_permission: str):
    """
    Verify that the current user has the required permission.
    """
    async def permission_dependency(current_user: Dict = Depends(get_current_user)):
        # In a real app, you would check if the user has the required permission
        # For now, we'll just check if the user is an admin
        if current_user["role_name"].lower() != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {required_permission}"
            )
        return current_user
    return permission_dependency