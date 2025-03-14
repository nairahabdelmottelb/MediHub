from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base user schema with common attributes"""
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    role_id: Optional[int] = None

class UserCreate(UserBase):
    """Schema for creating a new user (includes password)"""
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    role_id: Optional[int] = None

class UserResponse(BaseModel):
    """Schema for user response data"""
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    role_id: int
    role_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None 