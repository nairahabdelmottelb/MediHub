from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time
from enum import Enum

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_id: int

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserDetail(UserBase):
    user_id: int
    role_id: int
    role_name: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# Role schemas
class RoleBase(BaseModel):
    role_name: str
    description: str

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    pass

class RoleList(RoleBase):
    role_id: int
    user_count: int

class RoleDetail(RoleBase):
    role_id: int
    created_at: datetime
    updated_at: datetime
    users: List[Dict[str, Any]]

# Department schemas
class DepartmentBase(BaseModel):
    department_name: str
    description: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    pass

class DepartmentList(DepartmentBase):
    department_id: int
    doctor_count: int

class DepartmentDetail(DepartmentBase):
    department_id: int
    created_at: datetime
    updated_at: datetime
    doctors: List[Dict[str, Any]]

# Specialization schemas
class SpecializationBase(BaseModel):
    specialization_name: str
    description: str

class SpecializationCreate(SpecializationBase):
    pass

class SpecializationUpdate(SpecializationBase):
    pass

class SpecializationList(SpecializationBase):
    specialization_id: int
    doctor_count: int

class SpecializationDetail(SpecializationBase):
    specialization_id: int
    created_at: datetime
    updated_at: datetime
    doctors: List[Dict[str, Any]]

# Doctor schemas
class DoctorBase(BaseModel):
    user_id: int
    specialization_id: int
    department_id: int
    license_number: str
    bio: Optional[str] = None

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(BaseModel):
    specialization_id: Optional[int] = None
    department_id: Optional[int] = None
    license_number: Optional[str] = None
    bio: Optional[str] = None

class DoctorList(BaseModel):
    doctor_id: int
    user_id: int
    first_name: str
    last_name: str
    email: EmailStr
    specialization_name: str
    department_name: str

class DoctorDetail(DoctorList):
    license_number: str
    bio: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Patient schemas
class PatientBase(BaseModel):
    user_id: int
    date_of_birth: date
    gender: str
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None

class PatientList(BaseModel):
    patient_id: int
    user_id: int
    first_name: str
    last_name: str
    email: EmailStr
    date_of_birth: date
    gender: str

class PatientDetail(PatientList):
    blood_type: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    phone: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_id: Optional[str] = None
    allergies: List[Dict[str, Any]]
    medications: List[Dict[str, Any]]

# Appointment schemas
class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AppointmentBase(BaseModel):
    doctor_id: int
    patient_id: int
    appointment_date: date
    appointment_time: time
    reason: str
    status: AppointmentStatus = AppointmentStatus.SCHEDULED

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    reason: Optional[str] = None
    status: Optional[AppointmentStatus] = None

class AppointmentList(BaseModel):
    appointment_id: int
    doctor_id: int
    patient_id: int
    doctor_name: str
    patient_name: str
    appointment_date: date
    appointment_time: time
    status: AppointmentStatus

class AppointmentDetail(AppointmentList):
    reason: str
    created_at: datetime
    updated_at: datetime

# Medical Record schemas
class MedicalRecordBase(BaseModel):
    patient_id: int
    diagnosis: str
    treatment: str
    notes: Optional[str] = None

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordUpdate(BaseModel):
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None

class MedicalRecordList(BaseModel):
    record_id: int
    patient_id: int
    doctor_id: int
    diagnosis: str
    created_at: datetime
    doctor_name: str

class MedicalRecordDetail(MedicalRecordList):
    treatment: str
    notes: Optional[str] = None
    updated_at: datetime

# Insurance schemas
class InsuranceBase(BaseModel):
    provider_name: str
    plan_name: str
    coverage_details: str
    contact_info: str

class InsuranceCreate(InsuranceBase):
    pass

class InsuranceUpdate(InsuranceBase):
    pass

class InsuranceList(InsuranceBase):
    insurance_id: int

class InsuranceDetail(InsuranceList):
    created_at: datetime
    updated_at: datetime

# Timeslot schemas
class TimeslotBase(BaseModel):
    doctor_id: int
    day_of_week: int  # 0 = Monday, 6 = Sunday
    start_time: time
    end_time: time
    is_available: bool = True

class TimeslotCreate(TimeslotBase):
    pass

class TimeslotUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_available: Optional[bool] = None

class TimeslotList(TimeslotBase):
    timeslot_id: int

class TimeslotDetail(TimeslotList):
    created_at: datetime
    updated_at: datetime

# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# Message schema
class Message(BaseModel):
    recipient_id: int
    content: str

# Chatbot schemas
class ChatbotQuery(BaseModel):
    query: str

class ChatbotResponse(BaseModel):
    query: str
    response: str
    confidence: float

class ChatHistory(BaseModel):
    query: str
    response: str
    timestamp: datetime

# This file ensures that the schemas directory is treated as a Python package 