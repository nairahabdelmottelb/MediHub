from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time
import re

# Message schema
class Message(BaseModel):
    message: str

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role_id: int

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserDetail(UserBase):
    user_id: int
    role_name: str
    created_at: datetime
    updated_at: datetime

class UserList(BaseModel):
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    role_name: str

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

# Doctor schemas
class DoctorBase(BaseModel):
    user_id: int
    department_id: int
    specialization_id: int
    license_number: str
    years_of_experience: int
    education: str
    bio: str

class DoctorCreate(DoctorBase):
    pass

class DoctorUpdate(DoctorBase):
    pass

class DoctorDetail(DoctorBase):
    doctor_id: int
    first_name: str
    last_name: str
    email: EmailStr
    department_name: str
    specialization_name: str
    created_at: datetime
    updated_at: datetime

class DoctorList(BaseModel):
    doctor_id: int
    first_name: str
    last_name: str
    email: EmailStr
    department_name: str
    specialization_name: str

# Patient schemas
class PatientBase(BaseModel):
    user_id: int
    date_of_birth: date
    gender: str
    blood_type: str
    allergies: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relationship: str

class PatientCreate(PatientBase):
    pass

class PatientUpdate(PatientBase):
    pass

class PatientDetail(PatientBase):
    patient_id: int
    first_name: str
    last_name: str
    email: EmailStr
    created_at: datetime
    updated_at: datetime

class PatientList(BaseModel):
    patient_id: int
    first_name: str
    last_name: str
    email: EmailStr
    date_of_birth: date
    gender: str

# Appointment schemas
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: str
    status: str = "scheduled"

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(AppointmentBase):
    pass

class AppointmentDetail(AppointmentBase):
    appointment_id: int
    doctor_name: str
    patient_name: str
    created_at: datetime
    updated_at: datetime

class AppointmentList(BaseModel):
    appointment_id: int
    doctor_id: int
    patient_id: int
    doctor_name: str
    patient_name: str
    appointment_date: date
    appointment_time: time
    reason: str
    status: str

# Medical Record schemas
class MedicalRecordBase(BaseModel):
    diagnosis: str
    treatment: str
    notes: str

class MedicalRecordCreate(BaseModel):
    patient_id: int
    diagnosis: str
    treatment: str
    notes: str

class MedicalRecordUpdate(MedicalRecordBase):
    pass

class Doctor(BaseModel):
    first_name: str
    last_name: str

class Patient(BaseModel):
    first_name: str
    last_name: str

class MedicalRecordDetail(MedicalRecordBase):
    record_id: int
    patient_id: int
    doctor_id: int
    created_at: datetime
    updated_at: datetime
    doctor: Doctor
    patient: Patient

class MedicalRecordList(MedicalRecordBase):
    record_id: int
    created_at: datetime
    updated_at: datetime
    doctor: Doctor

# Prescription schemas
class PrescriptionBase(BaseModel):
    patient_id: int
    medication_name: str
    dosage: str
    frequency: str
    duration: str
    notes: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(PrescriptionBase):
    pass

class PrescriptionDetail(PrescriptionBase):
    prescription_id: int
    doctor_id: int
    doctor_name: str
    patient_name: str
    created_at: datetime
    updated_at: datetime

class PrescriptionList(BaseModel):
    prescription_id: int
    doctor_id: int
    patient_id: int
    doctor_name: str
    patient_name: str
    medication_name: str
    created_at: datetime

# Insurance schemas
class InsuranceBase(BaseModel):
    patient_id: int
    provider_name: str
    policy_number: str
    coverage_start_date: date
    coverage_end_date: date

class InsuranceCreate(InsuranceBase):
    pass

class InsuranceUpdate(InsuranceBase):
    pass

class InsuranceDetail(InsuranceBase):
    insurance_id: int
    patient_name: str
    created_at: datetime
    updated_at: datetime

class InsuranceList(BaseModel):
    insurance_id: int
    patient_id: int
    patient_name: str
    provider_name: str
    policy_number: str
    coverage_start_date: date
    coverage_end_date: date

# Timeslot schemas
class TimeslotBase(BaseModel):
    doctor_id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_available: bool = True

class TimeslotCreate(TimeslotBase):
    pass

class TimeslotUpdate(TimeslotBase):
    pass

class TimeslotDetail(TimeslotBase):
    timeslot_id: int
    doctor_name: str
    created_at: datetime
    updated_at: datetime

class TimeslotList(BaseModel):
    timeslot_id: int
    doctor_id: int
    doctor_name: str
    day_of_week: int
    start_time: time
    end_time: time
    is_available: bool

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Chat schemas
class ChatMessage(BaseModel):
    recipient_id: int
    content: str

class ChatResponse(BaseModel):
    message_id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: datetime
    is_read: bool

class ChatHistory(BaseModel):
    message_id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: datetime
    is_read: bool

class ChatConversation(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: EmailStr
    last_message: str
    last_message_time: datetime
    unread_count: int

# Chatbot schemas
class ChatbotQuery(BaseModel):
    query: str

class ChatbotResponse(BaseModel):
    query_id: int
    query: str
    response: str
    confidence: float
    timestamp: datetime

class ChatbotHistory(BaseModel):
    query_id: int
    query: str
    response: str
    confidence: float
    timestamp: datetime 