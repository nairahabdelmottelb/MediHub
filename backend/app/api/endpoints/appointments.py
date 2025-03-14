from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.config.database import db
from ..deps import get_current_user, get_current_admin, get_current_doctor
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import logging
from datetime import datetime, date, time

# Create schemas for appointment operations
class AppointmentBase(BaseModel):
    slot_id: int
    notes: Optional[str] = None
    priority_flag: Optional[bool] = Field(False, description="Flag for high priority appointments")

class AppointmentCreate(AppointmentBase):
    patient_id: Optional[int] = None

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    priority_flag: Optional[bool] = None
    slot_id: Optional[int] = None

class AppointmentInDB(BaseModel):
    appointment_id: int
    patient_id: int
    doctor_id: int
    slot_id: int
    appointment_date: datetime
    status: str
    notes: Optional[str] = None
    priority_flag: bool
    created_at: datetime
    updated_at: datetime

router = APIRouter()
logger = logging.getLogger(__name__)

# Print all routes for debugging
print("\nAppointments router routes in appointments.py:")
for route in router.routes:
    print(f"{route.path} - {route.methods}")

@router.post("/", 
             response_model=Dict,
             summary="Create a new appointment",
             description="Create a new appointment for a patient with a doctor at a specific time slot")
async def create_appointment(
    data: AppointmentCreate = Body(..., 
        example={
            "slot_id": 1,
            "notes": "Regular checkup",
            "priority_flag": False
        }
    ), 
    current_user: Dict = Depends(get_current_user)
):
    """
    Create a new appointment.
    
    - If the current user is a patient, the appointment will be created for them
    - If the current user is a doctor or admin, they can create appointments for any patient
    
    The time slot must be available.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if the slot is available
            cursor.execute(
                """
                SELECT * FROM TIMESLOTS
                WHERE slot_id = %s AND is_available = TRUE
                """,
                (data.slot_id,)
            )
            slot = cursor.fetchone()
            
            if not slot:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected time slot is not available"
                )
            
            # Get patient_id
            if current_user["role_name"] == "patient":
                cursor.execute(
                    "SELECT patient_id FROM PATIENTS WHERE user_id = %s",
                    (current_user["user_id"],)
                )
                patient = cursor.fetchone()
                if not patient:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Patient record not found for current user"
                    )
                patient_id = patient["patient_id"]
            else:
                if data.patient_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="patient_id is required when creating an appointment as a doctor or admin"
                    )
                patient_id = data.patient_id
            
            # Get doctor_id from slot
            cursor.execute(
                """
                SELECT dc.doctor_id
                FROM TIMESLOTS ts
                JOIN DOCTOR_CALENDAR dc ON ts.calendar_id = dc.calendar_id
                WHERE ts.slot_id = %s
                """,
                (data.slot_id,)
            )
            doctor_info = cursor.fetchone()
            if not doctor_info:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor information not found for this time slot"
                )
            doctor_id = doctor_info["doctor_id"]
            
            # Create appointment
            cursor.execute(
                """
                INSERT INTO APPOINTMENTS (
                    patient_id, doctor_id, slot_id,
                    appointment_date, status, notes,
                    priority_flag
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    patient_id,
                    doctor_id,
                    data.slot_id,
                    slot["start_time"],
                    "Scheduled",
                    data.notes,
                    data.priority_flag or False
                )
            )
            
            appointment_id = cursor.lastrowid
            
            # Mark slot as unavailable
            cursor.execute(
                """
                UPDATE TIMESLOTS
                SET is_available = FALSE
                WHERE slot_id = %s
                """,
                (data.slot_id,)
            )
    
    return {
        "appointment_id": appointment_id,
        "message": "Appointment created successfully"
    }

@router.get("/", 
            response_model=List[Dict],
            summary="Get user appointments",
            description="Retrieve all appointments for the current user (patient or doctor)")
async def get_appointments(current_user: Dict = Depends(get_current_user)):
    """
    Get all appointments for the current user.
    
    - If the user is a patient, returns all their appointments
    - If the user is a doctor, returns all appointments where they are the doctor
    - If the user is an admin, returns all appointments
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            if current_user["role_name"] == "admin":
                # Admins can see all appointments
                cursor.execute(
                    """
                    SELECT a.*, 
                           p.user_id as patient_user_id,
                           pu.first_name as patient_first_name,
                           pu.last_name as patient_last_name,
                           d.user_id as doctor_user_id,
                           du.first_name as doctor_first_name,
                           du.last_name as doctor_last_name,
                           ts.start_time, ts.end_time
                    FROM APPOINTMENTS a
                    JOIN PATIENTS p ON a.patient_id = p.patient_id
                    JOIN USERS pu ON p.user_id = pu.user_id
                    JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                    JOIN USERS du ON d.user_id = du.user_id
                    JOIN TIMESLOTS ts ON a.slot_id = ts.slot_id
                    ORDER BY a.appointment_date DESC
                    """
                )
            elif current_user["role_name"] == "doctor":
                # Doctors see their own appointments
                cursor.execute(
                    """
                    SELECT a.*, 
                           p.user_id as patient_user_id,
                           pu.first_name as patient_first_name,
                           pu.last_name as patient_last_name,
                           ts.start_time, ts.end_time
                    FROM APPOINTMENTS a
                    JOIN PATIENTS p ON a.patient_id = p.patient_id
                    JOIN USERS pu ON p.user_id = pu.user_id
                    JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                    JOIN TIMESLOTS ts ON a.slot_id = ts.slot_id
                    WHERE d.user_id = %s
                    ORDER BY a.appointment_date DESC
                    """,
                    (current_user["user_id"],)
                )
            else:
                # Patients see their own appointments
                cursor.execute(
                    """
                    SELECT a.*, 
                           d.user_id as doctor_user_id,
                           du.first_name as doctor_first_name,
                           du.last_name as doctor_last_name,
                           dep.department_name,
                           ts.start_time, ts.end_time
                    FROM APPOINTMENTS a
                    JOIN PATIENTS p ON a.patient_id = p.patient_id
                    JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                    JOIN USERS du ON d.user_id = du.user_id
                    JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                    JOIN TIMESLOTS ts ON a.slot_id = ts.slot_id
                    WHERE p.user_id = %s
                    ORDER BY a.appointment_date DESC
                    """,
                    (current_user["user_id"],)
                )
            
            appointments = cursor.fetchall()
    
    return appointments

@router.get("/{appointment_id}", 
            response_model=Dict,
            summary="Get appointment details",
            description="Retrieve detailed information about a specific appointment")
async def get_appointment(appointment_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get a specific appointment by ID.
    
    Users can only access appointments where they are either the patient or the doctor,
    unless they are an admin.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            if current_user["role_name"] == "admin":
                # Admins can see any appointment
                cursor.execute(
                    """
                    SELECT a.*, 
                           p.user_id as patient_user_id,
                           pu.first_name as patient_first_name,
                           pu.last_name as patient_last_name,
                           d.user_id as doctor_user_id,
                           du.first_name as doctor_first_name,
                           du.last_name as doctor_last_name,
                           dep.department_name,
                           ts.start_time, ts.end_time
                    FROM APPOINTMENTS a
                    JOIN PATIENTS p ON a.patient_id = p.patient_id
                    JOIN USERS pu ON p.user_id = pu.user_id
                    JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                    JOIN USERS du ON d.user_id = du.user_id
                    JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                    JOIN TIMESLOTS ts ON a.slot_id = ts.slot_id
                    WHERE a.appointment_id = %s
                    """,
                    (appointment_id,)
                )
            else:
                # Regular users can only see their own appointments
                cursor.execute(
                    """
                    SELECT a.*, 
                           p.user_id as patient_user_id,
                           pu.first_name as patient_first_name,
                           pu.last_name as patient_last_name,
                           d.user_id as doctor_user_id,
                           du.first_name as doctor_first_name,
                           du.last_name as doctor_last_name,
                           dep.department_name,
                           ts.start_time, ts.end_time
                    FROM APPOINTMENTS a
                    JOIN PATIENTS p ON a.patient_id = p.patient_id
                    JOIN USERS pu ON p.user_id = pu.user_id
                    JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                    JOIN USERS du ON d.user_id = du.user_id
                    JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                    JOIN TIMESLOTS ts ON a.slot_id = ts.slot_id
                    WHERE a.appointment_id = %s
                    AND (p.user_id = %s OR d.user_id = %s)
                    """,
                    (appointment_id, current_user["user_id"], current_user["user_id"])
                )
            
            appointment = cursor.fetchone()
            
            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Appointment not found or you don't have permission to view it"
                )
    
    return appointment

@router.put("/{appointment_id}", 
            response_model=Dict,
            summary="Update appointment",
            description="Update an existing appointment's status, notes, priority flag, or time slot")
async def update_appointment(
    appointment_id: int, 
    data: AppointmentUpdate = Body(...,
        example={
            "status": "Completed",
            "notes": "Patient is doing well",
            "priority_flag": True
        }
    ), 
    current_user: Dict = Depends(get_current_user)
):
    """
    Update an appointment.
    
    - Patients can only update their own appointments
    - Doctors can only update appointments where they are the doctor
    - Admins can update any appointment
    
    When changing the time slot, the new slot must be available.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Get the appointment
            cursor.execute(
                """
                SELECT a.*, p.user_id as patient_user_id, d.user_id as doctor_user_id
                FROM APPOINTMENTS a
                JOIN PATIENTS p ON a.patient_id = p.patient_id
                JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                WHERE a.appointment_id = %s
                """,
                (appointment_id,)
            )
            appointment = cursor.fetchone()
            
            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Appointment not found"
                )
            
            # Check permissions
            if current_user["role_name"] == "patient" and appointment["patient_user_id"] != current_user["user_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this appointment"
                )
            elif current_user["role_name"] == "doctor" and appointment["doctor_user_id"] != current_user["user_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this appointment"
                )
            
            # Update appointment
            update_fields = []
            params = []
            
            if data.status is not None:
                update_fields.append("status = %s")
                params.append(data.status)
            
            if data.notes is not None:
                update_fields.append("notes = %s")
                params.append(data.notes)
            
            if data.priority_flag is not None:
                update_fields.append("priority_flag = %s")
                params.append(data.priority_flag)
            
            if data.slot_id is not None and data.slot_id != appointment["slot_id"]:
                # Check if new slot is available
                cursor.execute(
                    """
                    SELECT * FROM TIMESLOTS
                    WHERE slot_id = %s AND is_available = TRUE
                    """,
                    (data.slot_id,)
                )
                new_slot = cursor.fetchone()
                
                if not new_slot:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Selected time slot is not available"
                    )
                
                # Update appointment date
                update_fields.append("appointment_date = %s")
                params.append(new_slot["start_time"])
                
                # Update slot
                update_fields.append("slot_id = %s")
                params.append(data.slot_id)
                
                # Mark old slot as available
                cursor.execute(
                    """
                    UPDATE TIMESLOTS
                    SET is_available = TRUE
                    WHERE slot_id = %s
                    """,
                    (appointment["slot_id"],)
                )
                
                # Mark new slot as unavailable
                cursor.execute(
                    """
                    UPDATE TIMESLOTS
                    SET is_available = FALSE
                    WHERE slot_id = %s
                    """,
                    (data.slot_id,)
                )
            
            if update_fields:
                # Add updated_at timestamp
                update_fields.append("updated_at = NOW()")
                
                # Add appointment_id to params
                params.append(appointment_id)
                
                cursor.execute(
                    f"""
                    UPDATE APPOINTMENTS
                    SET {", ".join(update_fields)}
                    WHERE appointment_id = %s
                    """,
                    params
                )
    
    return {"message": "Appointment updated successfully"}

@router.delete("/{appointment_id}", 
               response_model=Dict,
               summary="Cancel appointment",
               description="Cancel an existing appointment and free up the time slot")
async def cancel_appointment(
    appointment_id: int,
    current_user: Dict = Depends(get_current_user)
):
    """
    Cancel an appointment.
    
    - Patients can only cancel their own appointments
    - Doctors can only cancel appointments where they are the doctor
    - Admins can cancel any appointment
    
    This will mark the appointment as cancelled and make the time slot available again.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Get the appointment first to check permissions and get the slot_id
            cursor.execute(
                """
                SELECT a.*, p.user_id as patient_user_id, d.user_id as doctor_user_id
                FROM APPOINTMENTS a
                JOIN PATIENTS p ON a.patient_id = p.patient_id
                JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                WHERE a.appointment_id = %s
                """,
                (appointment_id,)
            )
            appointment = cursor.fetchone()
            
            if not appointment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Appointment not found"
                )
            
            # Check permissions
            if current_user["role_name"] == "patient" and appointment["patient_user_id"] != current_user["user_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to cancel this appointment"
                )
            elif current_user["role_name"] == "doctor" and appointment["doctor_user_id"] != current_user["user_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to cancel this appointment"
                )
            
            # Update appointment status
            cursor.execute(
                """
                UPDATE APPOINTMENTS
                SET status = 'Cancelled', updated_at = NOW()
                WHERE appointment_id = %s
                """,
                (appointment_id,)
            )
            
            # Make the time slot available again
            cursor.execute(
                """
                UPDATE TIMESLOTS
                SET is_available = TRUE
                WHERE slot_id = %s
                """,
                (appointment["slot_id"],)
            )
    
    return {"message": "Appointment cancelled successfully"} 