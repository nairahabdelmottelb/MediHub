from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class DoctorBase(BaseModel):
    """Base doctor schema with common attributes"""
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    address: Optional[str] = None
    specialty: str
    qualifications: str
    years_of_experience: int

class DoctorCreate(DoctorBase):
    """Schema for creating a new doctor (includes password)"""
    password: str = Field(..., min_length=8)

class DoctorUpdate(BaseModel):
    """Schema for updating doctor information"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    specialty: Optional[str] = None
    qualifications: Optional[str] = None
    years_of_experience: Optional[int] = None
    password: Optional[str] = Field(None, min_length=8)

class DoctorResponse(BaseModel):
    """Schema for doctor response data"""
    doctor_id: int
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    specialty: str
    qualifications: str
    years_of_experience: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None 