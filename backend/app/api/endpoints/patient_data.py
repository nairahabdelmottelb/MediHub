from fastapi import APIRouter, Depends, HTTPException, status
from ...config.database import db
from ..deps import get_current_user, get_current_active_doctor
from typing import Dict, List, Optional
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/patient-allergies")
async def create_patient_allergy(
    data: Dict,
    current_user: Dict = Depends(get_current_user)
):
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify patient access
            patient_id = data["patient_id"]
            
            if current_user["role_name"] == "patient":
                cursor.execute(
                    """
                    SELECT patient_id FROM PATIENTS
                    WHERE user_id = %s
                    """,
                    (current_user["user_id"],)
                )
                patient = cursor.fetchone()
                
                if not patient or patient["patient_id"] != patient_id:
                    raise HTTPException(
                        status_code=403,
                        detail="Not authorized to add allergies for this patient"
                    )
            
            # Check if allergy already exists
            cursor.execute(
                """
                SELECT * FROM PATIENT_ALLERGIES
                WHERE patient_id = %s AND allergy_name = %s
                """,
                (patient_id, data["allergy_name"])
            )
            
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="This allergy is already recorded for the patient"
                )
            
            # Create allergy record
            cursor.execute(
                """
                INSERT INTO PATIENT_ALLERGIES (
                    patient_id, allergy_name, severity,
                    reaction, diagnosed_date, created_by
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    patient_id,
                    data["allergy_name"],
                    data.get("severity"),
                    data.get("reaction"),
                    data.get("diagnosed_date"),
                    current_user["user_id"]
                )
            )
            
            allergy_id = cursor.lastrowid
    
    return {"allergy_id": allergy_id}

@router.get("/patient-allergies/{patient_id}")
async def get_patient_allergies(
    patient_id: int,
    current_user: Dict = Depends(get_current_user)
):
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            # Verify access rights
            if current_user["role_name"] == "patient":
                cursor.execute(
                    """
                    SELECT patient_id FROM PATIENTS
                    WHERE user_id = %s
                    """,
                    (current_user["user_id"],)
                )
                patient = cursor.fetchone()
                
                if not patient or patient["patient_id"] != patient_id:
                    raise HTTPException(
                        status_code=403,
                        detail="Not authorized to access these allergies"
                    )
            
            cursor.execute(
                """
                SELECT pa.*,
                       u.first_name as created_by_first_name,
                       u.last_name as created_by_last_name
                FROM PATIENT_ALLERGIES pa
                JOIN USERS u ON pa.created_by = u.user_id
                WHERE pa.patient_id = %s
                ORDER BY pa.severity DESC, pa.allergy_name
                """,
                (patient_id,)
            )
            
            allergies = cursor.fetchall()
    
    return allergies

@router.delete("/patient-allergies/{allergy_id}")
async def delete_patient_allergy(
    allergy_id: int,
    current_user: Dict = Depends(get_current_user)
):
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify allergy exists
            cursor.execute(
                """
                SELECT pa.*, p.user_id as patient_user_id
                FROM PATIENT_ALLERGIES pa
                JOIN PATIENTS p ON pa.patient_id = p.patient_id
                WHERE pa.allergy_id = %s
                """,
                (allergy_id,)
            )
            allergy = cursor.fetchone()
            
            if not allergy:
                raise HTTPException(
                    status_code=404,
                    detail="Allergy record not found"
                )
            
            # Check access rights
            if current_user["role_name"] == "patient" and allergy["patient_user_id"] != current_user["user_id"]:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to delete this allergy"
                )
            
            cursor.execute(
                """
                DELETE FROM PATIENT_ALLERGIES
                WHERE allergy_id = %s
                """,
                (allergy_id,)
            )
    
    return {"message": "Allergy record deleted successfully"}

@router.post("/patient-medications")
async def create_patient_medication(
    data: Dict,
    current_user: Dict = Depends(get_current_active_doctor)
):
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Create medication record
            cursor.execute(
                """
                INSERT INTO PATIENT_MEDS (
                    patient_id, medication_name, dosage,
                    frequency, start_date, end_date,
                    prescribed_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    data["patient_id"],
                    data["medication_name"],
                    data.get("dosage"),
                    data.get("frequency"),
                    data.get("start_date"),
                    data.get("end_date"),
                    current_user["user_id"]
                )
            )
            
            medication_id = cursor.lastrowid
            
            # Get patient user_id for notification
            cursor.execute(
                """
                SELECT user_id FROM PATIENTS
                WHERE patient_id = %s
                """,
                (data["patient_id"],)
            )
            patient = cursor.fetchone()
            
            # Create notification
            cursor.execute(
                """
                INSERT INTO NOTIFICATIONS (
                    user_id, notification_type,
                    content, reference_id, reference_type
                ) VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    patient["user_id"],
                    "MEDICATION",
                    f"New medication prescribed: {data['medication_name']}",
                    medication_id,
                    "PATIENT_MEDS"
                )
            )
    
    return {"medication_id": medication_id}

@router.get("/patient-medications/{patient_id}")
async def get_patient_medications(
    patient_id: int,
    current_user: Dict = Depends(get_current_user),
    active_only: bool = False
):
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            # Verify access rights
            if current_user["role_name"] == "patient":
                cursor.execute(
                    """
                    SELECT patient_id FROM PATIENTS
                    WHERE user_id = %s
                    """,
                    (current_user["user_id"],)
                )
                patient = cursor.fetchone()
                
                if not patient or patient["patient_id"] != patient_id:
                    raise HTTPException(
                        status_code=403,
                        detail="Not authorized to access these medications"
                    )
            
            query = """
                SELECT pm.*,
                       u.first_name as prescribed_by_first_name,
                       u.last_name as prescribed_by_last_name,
                       mr.record_id
                FROM PATIENT_MEDS pm
                JOIN USERS u ON pm.prescribed_by = u.user_id
                LEFT JOIN MEDICAL_RECORDS mr ON pm.record_id = mr.record_id
                WHERE pm.patient_id = %s
            """
            params = [patient_id]
            
            if active_only:
                query += " AND (pm.end_date IS NULL OR pm.end_date >= CURDATE())"
            
            query += " ORDER BY pm.start_date DESC"
            
            cursor.execute(query, params)
            medications = cursor.fetchall()
    
    return medications

@router.delete("/patient-medications/{medication_id}")
async def delete_patient_medication(
    medication_id: int,
    current_user: Dict = Depends(get_current_active_doctor)
):
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify medication exists
            cursor.execute(
                """
                SELECT * FROM PATIENT_MEDS
                WHERE med_id = %s
                """,
                (medication_id,)
            )
            medication = cursor.fetchone()
            
            if not medication:
                raise HTTPException(
                    status_code=404,
                    detail="Medication record not found"
                )
            
            cursor.execute(
                """
                DELETE FROM PATIENT_MEDS
                WHERE med_id = %s
                """,
                (medication_id,)
            )
    
    return {"message": "Medication record deleted successfully"} 