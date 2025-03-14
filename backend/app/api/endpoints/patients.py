from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.config.database import db
from ..deps import get_current_user, get_current_patient, get_current_admin, get_current_doctor
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import date, datetime
import logging

# Create schemas for patient operations
class AllergyBase(BaseModel):
    allergy_name: str
    severity: str = Field(..., description="Low, Medium, or High")

class AllergyCreate(AllergyBase):
    date_identified: Optional[date] = None

class AllergyUpdate(BaseModel):
    allergy_name: Optional[str] = None
    severity: Optional[str] = None
    date_identified: Optional[date] = None

class MedicationBase(BaseModel):
    medication_name: str
    dosage: str
    frequency: str
    prescribing_doctor: Optional[str] = None

class MedicationCreate(MedicationBase):
    start_date: date
    end_date: Optional[date] = None

class MedicationUpdate(BaseModel):
    medication_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    prescribing_doctor: Optional[str] = None

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("")
async def get_patients(current_user: Dict = Depends(get_current_doctor)):
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.patient_id, u.first_name, u.last_name, 
                       u.email, u.phone, p.date_of_birth, p.gender,
                       p.blood_type, i.provider as insurance_provider
                FROM PATIENTS p
                JOIN USERS u ON p.user_id = u.user_id
                LEFT JOIN INSURANCE i ON p.insurance_id = i.insurance_id
                ORDER BY u.last_name, u.first_name
                """
            )
            return cursor.fetchall()

@router.get("/{patient_id}")
async def get_patient(patient_id: int, current_user: Dict = Depends(get_current_user)):
    # Check if user is the patient, a doctor, or an admin
    is_authorized = False
    if current_user["role_name"] == "admin" or current_user["role_name"] == "doctor":
        is_authorized = True
    elif current_user["role_name"] == "patient":
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
            status_code=403,
            detail="Not authorized to access this patient's information"
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.*, u.first_name, u.last_name, 
                       u.email, u.phone, i.provider as insurance_provider
                FROM PATIENTS p
                JOIN USERS u ON p.user_id = u.user_id
                LEFT JOIN INSURANCE i ON p.insurance_id = i.insurance_id
                WHERE p.patient_id = %s
                """,
                (patient_id,)
            )
            patient = cursor.fetchone()
            
            if not patient:
                raise HTTPException(
                    status_code=404,
                    detail="Patient not found"
                )
                
            # Get patient's allergies
            cursor.execute(
                """
                SELECT * FROM PATIENT_ALLERGIES
                WHERE patient_id = %s
                """,
                (patient_id,)
            )
            patient["allergies"] = cursor.fetchall()
            
            # Get patient's medications
            cursor.execute(
                """
                SELECT * FROM PATIENT_MEDS
                WHERE patient_id = %s
                """,
                (patient_id,)
            )
            patient["medications"] = cursor.fetchall()
            
            # Get patient's appointments
            cursor.execute(
                """
                SELECT a.appointment_id, a.appointment_date, a.status,
                       d.doctor_id, u.first_name as doctor_first_name,
                       u.last_name as doctor_last_name,
                       s.spec_name, dep.department_name
                FROM APPOINTMENTS a
                JOIN DOCTORS d ON a.doctor_id = d.doctor_id
                JOIN USERS u ON d.user_id = u.user_id
                JOIN SPECIALIZATIONS s ON d.spec_id = s.spec_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                WHERE a.patient_id = %s
                ORDER BY a.appointment_date DESC
                """,
                (patient_id,)
            )
            patient["appointments"] = cursor.fetchall()
            
            # Get patient's medical records
            if current_user["role_name"] == "doctor" or current_user["role_name"] == "admin":
                cursor.execute(
                    """
                    SELECT mr.*, u.first_name as doctor_first_name,
                           u.last_name as doctor_last_name
                    FROM MEDICAL_RECORDS mr
                    JOIN DOCTORS d ON mr.doctor_id = d.doctor_id
                    JOIN USERS u ON d.user_id = u.user_id
                    WHERE mr.patient_id = %s
                    ORDER BY mr.created_at DESC
                    """,
                    (patient_id,)
                )
                patient["medical_records"] = cursor.fetchall()
    
    return patient

@router.post("/{patient_id}/allergies", response_model=Dict)
async def add_patient_allergy(
    patient_id: int,
    allergy: AllergyCreate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Add a new allergy for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to add allergies for this patient"
        )
    
    # Set date_identified to today if not provided
    if not allergy.date_identified:
        allergy.date_identified = date.today()
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if patient exists
            cursor.execute(
                """
                SELECT patient_id FROM PATIENTS
                WHERE patient_id = %s
                """,
                (patient_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            
            # Add allergy - removing date_identified field
            cursor.execute(
                """
                INSERT INTO PATIENT_ALLERGIES (
                    patient_id, allergy_name, severity
                ) VALUES (%s, %s, %s)
                """,
                (
                    patient_id,
                    allergy.allergy_name,
                    allergy.severity
                )
            )
            
            allergy_id = cursor.lastrowid
    
    return {
        "allergy_id": allergy_id,
        "patient_id": patient_id,
        "allergy_name": allergy.allergy_name,
        "severity": allergy.severity,
        "message": "Allergy added successfully"
    }

@router.get("/{patient_id}/allergies", response_model=List[Dict])
async def get_patient_allergies(
    patient_id: int,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get all allergies for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to view allergies for this patient"
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT allergy_id, patient_id, allergy_name, severity
                FROM PATIENT_ALLERGIES
                WHERE patient_id = %s
                """,
                (patient_id,)
            )
            allergies = cursor.fetchall()
    
    return allergies

@router.put("/{patient_id}/allergies/{allergy_id}", response_model=Dict)
async def update_patient_allergy(
    patient_id: int,
    allergy_id: int,
    allergy: AllergyUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update an allergy for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to update allergies for this patient"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if allergy exists and belongs to the patient
            cursor.execute(
                """
                SELECT * FROM PATIENT_ALLERGIES
                WHERE allergy_id = %s AND patient_id = %s
                """,
                (allergy_id, patient_id)
            )
            existing_allergy = cursor.fetchone()
            
            if not existing_allergy:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Allergy not found or does not belong to this patient"
                )
            
            # Build update query
            update_fields = []
            params = []
            
            if allergy.allergy_name is not None:
                update_fields.append("allergy_name = %s")
                params.append(allergy.allergy_name)
            
            if allergy.severity is not None:
                update_fields.append("severity = %s")
                params.append(allergy.severity)
            
            # Remove date_identified from update fields
            
            if not update_fields:
                return existing_allergy
            
            # Add allergy_id to params
            params.append(allergy_id)
            
            # Update allergy
            cursor.execute(
                f"""
                UPDATE PATIENT_ALLERGIES
                SET {", ".join(update_fields)}
                WHERE allergy_id = %s
                """,
                tuple(params)
            )
            
            # Get updated allergy
            cursor.execute(
                """
                SELECT allergy_id, patient_id, allergy_name, severity
                FROM PATIENT_ALLERGIES
                WHERE allergy_id = %s
                """,
                (allergy_id,)
            )
            updated_allergy = cursor.fetchone()
    
    return {
        **updated_allergy,
        "message": "Allergy updated successfully"
    }

@router.delete("/{patient_id}/allergies/{allergy_id}", response_model=Dict)
async def delete_patient_allergy(
    patient_id: int,
    allergy_id: int,
    current_user: Dict = Depends(get_current_user)
):
    """
    Delete an allergy for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to delete allergies for this patient"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if allergy exists and belongs to the patient
            cursor.execute(
                """
                SELECT * FROM PATIENT_ALLERGIES
                WHERE allergy_id = %s AND patient_id = %s
                """,
                (allergy_id, patient_id)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Allergy not found or does not belong to this patient"
                )
            
            # Delete allergy
            cursor.execute(
                """
                DELETE FROM PATIENT_ALLERGIES
                WHERE allergy_id = %s
                """,
                (allergy_id,)
            )
    
    return {
        "allergy_id": allergy_id,
        "message": "Allergy deleted successfully"
    }

# Medications endpoints
@router.get("/{patient_id}/medications", response_model=List[Dict])
async def get_patient_medications(
    patient_id: int,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get all medications for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to view medications for this patient"
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT medication_id, patient_id, medication_name, dosage
                FROM PATIENT_MEDS
                WHERE patient_id = %s
                """,
                (patient_id,)
            )
            medications = cursor.fetchall()
    
    return medications

@router.post("/{patient_id}/medications", response_model=Dict)
async def add_patient_medication(
    patient_id: int,
    medication: MedicationCreate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Add a new medication for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to add medications for this patient"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if patient exists
            cursor.execute(
                """
                SELECT patient_id FROM PATIENTS
                WHERE patient_id = %s
                """,
                (patient_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Patient not found"
                )
            
            # Add medication - only using fields that exist in the schema
            cursor.execute(
                """
                INSERT INTO PATIENT_MEDS (
                    patient_id, medication_name, dosage
                ) VALUES (%s, %s, %s)
                """,
                (
                    patient_id,
                    medication.medication_name,
                    medication.dosage
                )
            )
            
            medication_id = cursor.lastrowid
    
    return {
        "medication_id": medication_id,
        "patient_id": patient_id,
        "medication_name": medication.medication_name,
        "dosage": medication.dosage,
        "message": "Medication added successfully"
    }

@router.put("/{patient_id}/medications/{medication_id}", response_model=Dict)
async def update_patient_medication(
    patient_id: int,
    medication_id: int,
    medication: MedicationUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update a medication for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to update medications for this patient"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if medication exists and belongs to the patient
            cursor.execute(
                """
                SELECT * FROM PATIENT_MEDS
                WHERE medication_id = %s AND patient_id = %s
                """,
                (medication_id, patient_id)
            )
            existing_medication = cursor.fetchone()
            
            if not existing_medication:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Medication not found or does not belong to this patient"
                )
            
            # Build update query - only using fields that exist in the schema
            update_fields = []
            params = []
            
            if medication.medication_name is not None:
                update_fields.append("medication_name = %s")
                params.append(medication.medication_name)
            
            if medication.dosage is not None:
                update_fields.append("dosage = %s")
                params.append(medication.dosage)
            
            if not update_fields:
                return existing_medication
            
            # Add medication_id to params
            params.append(medication_id)
            
            # Update medication
            cursor.execute(
                f"""
                UPDATE PATIENT_MEDS
                SET {", ".join(update_fields)}
                WHERE medication_id = %s
                """,
                tuple(params)
            )
            
            # Get updated medication
            cursor.execute(
                """
                SELECT medication_id, patient_id, medication_name, dosage
                FROM PATIENT_MEDS
                WHERE medication_id = %s
                """,
                (medication_id,)
            )
            updated_medication = cursor.fetchone()
    
    return {
        **updated_medication,
        "message": "Medication updated successfully"
    }

@router.delete("/{patient_id}/medications/{medication_id}", response_model=Dict)
async def delete_patient_medication(
    patient_id: int,
    medication_id: int,
    current_user: Dict = Depends(get_current_user)
):
    """
    Delete a medication for a patient.
    """
    # Check if user is authorized
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
            detail="Not authorized to delete medications for this patient"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if medication exists and belongs to the patient
            cursor.execute(
                """
                SELECT * FROM PATIENT_MEDS
                WHERE medication_id = %s AND patient_id = %s
                """,
                (medication_id, patient_id)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Medication not found or does not belong to this patient"
                )
            
            # Delete medication
            cursor.execute(
                """
                DELETE FROM PATIENT_MEDS
                WHERE medication_id = %s
                """,
                (medication_id,)
            )
    
    return {
        "medication_id": medication_id,
        "message": "Medication deleted successfully"
    } 