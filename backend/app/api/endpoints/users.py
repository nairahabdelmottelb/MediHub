from fastapi import APIRouter, Depends, HTTPException, status
from app.config.database import db
from app.utils.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Dict, List, Optional
from datetime import date
from ..deps import get_current_admin, get_current_user
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create schemas for user operations
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_id: int
    phone: str

class DoctorCreate(UserBase):
    password: str
    phone: str
    department_id: int
    spec_id: int
    years_of_exp: int

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None

class UserInDB(BaseModel):
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role_id: int
    role_name: str

router = APIRouter()

@router.get("/", response_model=List[UserInDB])
async def get_users(current_user: Dict = Depends(get_current_admin)):
    """
    Get all users. Admin only.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, 
                       u.phone, u.role_id, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                ORDER BY u.user_id
                """
            )
            users = cursor.fetchall()
    
    return users

@router.get("/{user_id}", response_model=UserInDB)
async def get_user(user_id: int, current_user: Dict = Depends(get_current_admin)):
    """
    Get a specific user by ID. Admin only.
    """
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
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/", response_model=UserInDB)
async def create_user(user: UserCreate, current_user: Dict = Depends(get_current_admin)):
    """
    Create a new user. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if email already exists
            cursor.execute(
                "SELECT user_id FROM users WHERE email = %s",
                (user.email,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Check if role exists
            cursor.execute(
                "SELECT role_id FROM roles WHERE role_id = %s",
                (user.role_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role does not exist"
                )
            
            # Hash the password
            hashed_password = get_password_hash(user.password)
            
            # Insert new user
            cursor.execute(
                """
                INSERT INTO users (email, password, first_name, last_name, phone, role_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    user.email,
                    hashed_password,
                    user.first_name,
                    user.last_name,
                    user.phone,
                    user.role_id
                )
            )
            
            # Get the last inserted ID
            user_id = cursor.lastrowid
            
            # Get the complete user data
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
            new_user = cursor.fetchone()
    
    return new_user

@router.put("/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: int, 
    user: UserUpdate, 
    current_user: Dict = Depends(get_current_admin)
):
    """
    Update a user. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if user exists
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = %s",
                (user_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Check if email already exists (if provided)
            if user.email:
                cursor.execute(
                    "SELECT user_id FROM users WHERE email = %s AND user_id != %s",
                    (user.email, user_id)
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
            
            # Check if role exists (if provided)
            if user.role_id:
                cursor.execute(
                    "SELECT role_id FROM roles WHERE role_id = %s",
                    (user.role_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Role does not exist"
                    )
            
            # Build update query dynamically
            update_fields = []
            params = []
            
            if user.email is not None:
                update_fields.append("email = %s")
                params.append(user.email)
            
            if user.first_name is not None:
                update_fields.append("first_name = %s")
                params.append(user.first_name)
            
            if user.last_name is not None:
                update_fields.append("last_name = %s")
                params.append(user.last_name)
            
            if user.phone is not None:
                update_fields.append("phone = %s")
                params.append(user.phone)
            
            if user.role_id is not None:
                update_fields.append("role_id = %s")
                params.append(user.role_id)
            
            # If no fields to update, return current user
            if not update_fields:
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
                return cursor.fetchone()
            
            # Add user_id to params
            params.append(user_id)
            
            # Update user
            cursor.execute(
                f"""
                UPDATE users
                SET {", ".join(update_fields)}
                WHERE user_id = %s
                """,
                tuple(params)
            )
            
            # Get updated user
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
            updated_user = cursor.fetchone()
    
    return updated_user

@router.delete("/{user_id}", response_model=Dict)
async def delete_user(user_id: int, current_user: Dict = Depends(get_current_admin)):
    """
    Delete a user. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if user exists
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = %s",
                (user_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Delete user
            cursor.execute(
                "DELETE FROM users WHERE user_id = %s",
                (user_id,)
            )
    
    return {"message": "User deleted successfully"}

@router.get("/me")
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """
    Get information about the currently authenticated user.
    """
    logger.info(f"User requesting own info: {current_user['user_id']}")
    
    # Return a properly formatted user object that matches what the frontend expects
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"],
        "role_id": current_user["role_id"],
        "role_name": current_user["role_name"],
        "phone": current_user.get("phone", "")
    }

@router.get("/{user_id}", response_model=Dict)
async def get_user(user_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get information about a specific user by ID.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.user_id = %s
                """,
                (user_id,)
            )
            user = cursor.fetchone()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.get("/", response_model=List[Dict])
async def get_users(current_user: Dict = Depends(get_current_user)):
    """
    Get a list of all users.
    """
    # Check if user has admin role
    if current_user.get("role_name", "").lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                """
            )
            users = cursor.fetchall()
    
    return users 