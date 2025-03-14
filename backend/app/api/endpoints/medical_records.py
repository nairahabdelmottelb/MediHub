from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from ...config.database import db
from ..deps import get_current_user, get_current_doctor, get_current_admin
from typing import Dict, List, Optional
import logging
from datetime import datetime
from app.schemas import (
    MedicalRecordCreate, 
    MedicalRecordDetail, 
    MedicalRecordList, 
    MedicalRecordUpdate,
    Message
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Define Pydantic models for request/response validation
class MedicalRecordCreate(BaseModel):
    patient_id: int = Field(..., example=1, description="ID of the patient")
    appointment_id: Optional[int] = Field(None, example=5, description="ID of the related appointment (optional)")
    diagnosis: str = Field(..., example="Seasonal allergies", description="Medical diagnosis")
    prescriptions: Optional[str] = Field(None, example="Cetirizine 10mg daily", description="Prescribed medications")
    lab_results: Optional[str] = Field(None, example="Blood test results normal", description="Laboratory test results")

class MedicalRecordUpdate(BaseModel):
    diagnosis: Optional[str] = Field(None, example="Chronic sinusitis", description="Updated medical diagnosis")
    prescriptions: Optional[str] = Field(None, example="Fluticasone nasal spray", description="Updated prescribed medications")
    lab_results: Optional[str] = Field(None, example="Elevated white blood cell count", description="Updated laboratory test results")

class MedicalRecordResponse(BaseModel):
    record_id: int = Field(..., example=1, description="Unique identifier for the medical record")
    patient_id: int = Field(..., example=1, description="ID of the patient")
    doctor_id: int = Field(..., example=2, description="ID of the doctor")
    appointment_id: Optional[int] = Field(None, example=5, description="ID of the related appointment")
    diagnosis: str = Field(..., example="Seasonal allergies", description="Medical diagnosis")
    prescriptions: Optional[str] = Field(None, example="Cetirizine 10mg daily", description="Prescribed medications")
    lab_results: Optional[str] = Field(None, example="Blood test results normal", description="Laboratory test results")
    created_at: datetime = Field(..., example="2023-06-15T10:30:00", description="When the record was created")

@router.post("/", response_model=Dict, status_code=status.HTTP_201_CREATED,
            summary="Create new medical record",
            description="Create a new medical record for a patient. Requires doctor privileges.")
async def create_medical_record(
    record: MedicalRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new medical record with the following information:
    
    - **patient_id**: ID of the patient
    - **appointment_id**: Optional ID of the related appointment
    - **diagnosis**: Medical diagnosis
    - **prescriptions**: Optional prescribed medications
    - **lab_results**: Optional laboratory test results
    
    Returns the ID of the newly created medical record.
    """
    # Check if user is a doctor
    if current_user["role_name"] != "doctor" and current_user["role_name"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create medical records"
        )
    
    # Get doctor_id for the current user
    doctor_id = None
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT doctor_id FROM DOCTORS
                WHERE user_id = %s
                """,
                (current_user["user_id"],)
            )
            doctor_result = cursor.fetchone()
            if not doctor_result:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User is not registered as a doctor"
                )
            doctor_id = doctor_result["doctor_id"]
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify patient exists
            cursor.execute(
                "SELECT patient_id FROM PATIENTS WHERE patient_id = %s",
                (record.patient_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Patient not found")
            
            # Verify appointment exists if provided
            if record.appointment_id:
                cursor.execute(
                    "SELECT appointment_id FROM APPOINTMENTS WHERE appointment_id = %s",
                    (record.appointment_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(status_code=404, detail="Appointment not found")
            
            cursor.execute(
                """
                INSERT INTO MEDICAL_RECORDS (
                    patient_id, doctor_id, appointment_id, diagnosis, prescriptions, lab_results
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    record.patient_id,
                    doctor_id,
                    record.appointment_id,
                    record.diagnosis,
                    record.prescriptions,
                    record.lab_results
                )
            )
            
            record_id = cursor.lastrowid
            
    return {"record_id": record_id, "message": "Medical record created successfully"}

@router.get("/{record_id}", response_model=Dict,
           summary="Get medical record details",
           description="Retrieve detailed information about a specific medical record.")
async def get_medical_record(
    record_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve detailed information about a specific medical record.
    
    - **record_id**: ID of the medical record to retrieve
    
    Returns the medical record with doctor and patient information.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT mr.*, 
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name,
                       p.first_name as patient_first_name, p.last_name as patient_last_name
                FROM MEDICAL_RECORDS mr
                JOIN DOCTORS doc ON mr.doctor_id = doc.doctor_id
                JOIN USERS d ON doc.user_id = d.user_id
                JOIN PATIENTS pat ON mr.patient_id = pat.patient_id
                JOIN USERS p ON pat.user_id = p.user_id
                WHERE mr.record_id = %s
                """,
                (record_id,)
            )
            record = cursor.fetchone()
            
            if not record:
                raise HTTPException(status_code=404, detail="Medical record not found")
            
            # Check authorization
            is_authorized = False
            if current_user["role_name"] == "admin" or current_user["role_name"] == "doctor":
                is_authorized = True
            elif current_user["role_name"] == "patient":
                # Check if current user is the patient
                cursor.execute(
                    """
                    SELECT patient_id FROM PATIENTS
                    WHERE user_id = %s
                    """,
                    (current_user["user_id"],)
                )
                patient = cursor.fetchone()
                if patient and patient["patient_id"] == record["patient_id"]:
                    is_authorized = True
            
            if not is_authorized:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this medical record"
                )
            
            # Format the response
            formatted_record = {
                "record_id": record["record_id"],
                "patient_id": record["patient_id"],
                "doctor_id": record["doctor_id"],
                "appointment_id": record["appointment_id"],
                "diagnosis": record["diagnosis"],
                "prescriptions": record["prescriptions"],
                "lab_results": record["lab_results"],
                "created_at": record["created_at"],
                "doctor": {
                    "first_name": record["doctor_first_name"],
                    "last_name": record["doctor_last_name"]
                },
                "patient": {
                    "first_name": record["patient_first_name"],
                    "last_name": record["patient_last_name"]
                }
            }
            
            return formatted_record

@router.get("/patient/{patient_id}", response_model=List[Dict],
           summary="Get patient medical records",
           description="Retrieve all medical records for a specific patient.")
async def get_patient_medical_records(
    patient_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all medical records for a specific patient.
    
    - **patient_id**: ID of the patient
    
    Returns a list of medical records with doctor information.
    """
    # Check authorization
    is_authorized = False
    if current_user["role_name"] == "admin" or current_user["role_name"] == "doctor":
        is_authorized = True
    elif current_user["role_name"] == "patient":
        # Check if current user is the patient
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT patient_id FROM PATIENTS
                    WHERE user_id = %s
                    """,
                    (current_user["user_id"],)
                )
                patient = cursor.fetchone()
                if patient and patient["patient_id"] == patient_id:
                    is_authorized = True
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view medical records for this patient"
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT mr.*, 
                       d.first_name as doctor_first_name, d.last_name as doctor_last_name
                FROM MEDICAL_RECORDS mr
                JOIN DOCTORS doc ON mr.doctor_id = doc.doctor_id
                JOIN USERS d ON doc.user_id = d.user_id
                WHERE mr.patient_id = %s
                ORDER BY mr.created_at DESC
                """,
                (patient_id,)
            )
            records = cursor.fetchall()
            
            formatted_records = []
            for record in records:
                formatted_records.append({
                    "record_id": record["record_id"],
                    "patient_id": record["patient_id"],
                    "doctor_id": record["doctor_id"],
                    "appointment_id": record["appointment_id"],
                    "diagnosis": record["diagnosis"],
                    "prescriptions": record["prescriptions"],
                    "lab_results": record["lab_results"],
                    "created_at": record["created_at"],
                    "doctor": {
                        "first_name": record["doctor_first_name"],
                        "last_name": record["doctor_last_name"]
                    }
                })
            
            return formatted_records

@router.put("/{record_id}", response_model=Dict,
           summary="Update medical record",
           description="Update an existing medical record. Requires doctor privileges.")
async def update_medical_record(
    record_id: int,
    record_update: MedicalRecordUpdate,
    current_user: dict = Depends(get_current_user),
    doctor: dict = Depends(get_current_doctor)
):
    """
    Update an existing medical record.
    
    - **record_id**: ID of the medical record to update
    - **record_update**: Updated medical record information
    
    Only the doctor who created the record or an admin can update it.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            # Get the existing record
            cursor.execute(
                "SELECT * FROM MEDICAL_RECORDS WHERE record_id = %s",
                (record_id,)
            )
            record = cursor.fetchone()
            
            if not record:
                raise HTTPException(status_code=404, detail="Medical record not found")
            
            # Check if the doctor is authorized to update this record
            if record["doctor_id"] != doctor["doctor_id"] and current_user["role_name"] != "admin":
                raise HTTPException(status_code=403, detail="Not authorized to update this medical record")
    
    # Build update query dynamically based on provided fields
    update_fields = []
    params = []
    
    if record_update.diagnosis is not None:
        update_fields.append("diagnosis = %s")
        params.append(record_update.diagnosis)
        
    if record_update.prescriptions is not None:
        update_fields.append("prescriptions = %s")
        params.append(record_update.prescriptions)
        
    if record_update.lab_results is not None:
        update_fields.append("lab_results = %s")
        params.append(record_update.lab_results)
    
    if not update_fields:
        return {"message": "No fields to update"}
    
    # Add record_id to params
    params.append(record_id)
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Update the record
            cursor.execute(
                f"""
                UPDATE MEDICAL_RECORDS
                SET {", ".join(update_fields)}
                WHERE record_id = %s
                """,
                tuple(params)
            )
            
    return {"message": "Medical record updated successfully"}

@router.delete("/{record_id}", response_model=Dict,
              summary="Delete medical record",
              description="Delete a medical record. Requires admin privileges.")
async def delete_medical_record(
    record_id: int,
    current_user: dict = Depends(get_current_admin)
):
    """
    Delete a medical record from the system.
    
    - **record_id**: ID of the medical record to delete
    
    Only administrators can delete medical records.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if record exists
            cursor.execute(
                "SELECT record_id FROM MEDICAL_RECORDS WHERE record_id = %s",
                (record_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Medical record not found")
            
            # Delete the record
            cursor.execute(
                "DELETE FROM MEDICAL_RECORDS WHERE record_id = %s",
                (record_id,)
            )
    
    return {"message": "Medical record deleted successfully"} 