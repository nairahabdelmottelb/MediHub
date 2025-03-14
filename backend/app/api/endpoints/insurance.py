from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from ...config.database import db
from ..deps import get_current_user, get_current_admin
from typing import Dict, List, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Define Pydantic models for request/response validation and SwaggerUI documentation
class InsuranceBase(BaseModel):
    provider: str = Field(..., example="Blue Cross Blue Shield", description="Name of the insurance provider")
    policy_number: str = Field(..., example="POL123456789", description="Insurance policy number")
    coverage_details: Optional[str] = Field(None, example="80% coverage for in-network providers, $1000 deductible", 
                                          description="Details about the insurance coverage")

class InsuranceCreate(InsuranceBase):
    pass

class InsuranceUpdate(InsuranceBase):
    provider: Optional[str] = Field(None, example="Aetna", description="Name of the insurance provider")
    policy_number: Optional[str] = Field(None, example="POL987654321", description="Insurance policy number")

class InsuranceInDB(InsuranceBase):
    insurance_id: int = Field(..., example=1, description="Unique identifier for the insurance record")

class InsuranceWithPatientCount(InsuranceInDB):
    patient_count: int = Field(..., example=5, description="Number of patients using this insurance")

class PatientBasicInfo(BaseModel):
    patient_id: int = Field(..., example=42, description="Unique identifier for the patient")
    first_name: str = Field(..., example="John", description="Patient's first name")
    last_name: str = Field(..., example="Doe", description="Patient's last name")

class InsuranceWithPatients(InsuranceInDB):
    patients: Optional[List[PatientBasicInfo]] = Field(None, description="List of patients using this insurance")

class MessageResponse(BaseModel):
    message: str = Field(..., example="Operation completed successfully")
    insurance_id: Optional[int] = Field(None, example=1, description="ID of the affected insurance record")

# Print all routes for debugging
print("\nInsurance router routes in insurance.py:")
for route in router.routes:
    print(f"{route.path} - {route.methods}")

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED,
            summary="Create new insurance record",
            description="Create a new insurance provider record in the system. Requires admin privileges.")
async def create_insurance(data: InsuranceCreate, current_user: Dict = Depends(get_current_admin)):
    """
    Create a new insurance provider record with the following information:
    
    - **provider**: Name of the insurance company
    - **policy_number**: Policy number format
    - **coverage_details**: Optional details about coverage
    
    Returns the ID of the newly created insurance record.
    """
    # Print the current_user object for debugging
    print("\nCurrent user in endpoint:", current_user)
    
    # Check if user has admin role (handle both structures)
    if not current_user or (
        current_user.get("role_name") != "admin" and 
        current_user.get("role", {}).get("role_name") != "admin" and
        current_user.get("role") != "admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )

    with db.transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO INSURANCE (
                    provider, policy_number, coverage_details
                ) VALUES (%s, %s, %s)
                """,
                (
                    data.provider,
                    data.policy_number,
                    data.coverage_details
                )
            )
            insurance_id = cursor.lastrowid
    
    return {"insurance_id": insurance_id, "message": "Insurance information created successfully"}

@router.get("/", response_model=List[InsuranceWithPatientCount],
           summary="Get all insurance providers",
           description="Retrieve a list of all insurance providers with patient count.")
async def get_insurance_providers(current_user: Dict = Depends(get_current_user)):
    """
    Retrieve a list of all insurance providers in the system.
    
    For each provider, the response includes:
    - Basic insurance information
    - Count of patients using this insurance
    
    Results are ordered by provider name.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT i.*, COUNT(p.patient_id) as patient_count
                FROM INSURANCE i
                LEFT JOIN PATIENTS p ON i.insurance_id = p.insurance_id
                GROUP BY i.insurance_id
                ORDER BY i.provider
                """
            )
            return cursor.fetchall()

@router.get("/{insurance_id}", response_model=InsuranceWithPatients,
           summary="Get insurance provider details",
           description="Retrieve detailed information about a specific insurance provider.")
async def get_insurance(insurance_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Retrieve detailed information about a specific insurance provider.
    
    - **insurance_id**: ID of the insurance provider to retrieve
    
    If the user has admin privileges, the response will include a list of patients
    using this insurance provider.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM INSURANCE
                WHERE insurance_id = %s
                """,
                (insurance_id,)
            )
            insurance = cursor.fetchone()
            
            if not insurance:
                raise HTTPException(
                    status_code=404,
                    detail="Insurance provider not found"
                )
            
            # If admin, include patients with this insurance
            if current_user["role_name"] == "admin":
                cursor.execute(
                    """
                    SELECT p.patient_id, u.first_name, u.last_name
                    FROM PATIENTS p
                    JOIN USERS u ON p.user_id = u.user_id
                    WHERE p.insurance_id = %s
                    """,
                    (insurance_id,)
                )
                insurance["patients"] = cursor.fetchall()
    
    return insurance

@router.put("/{insurance_id}", response_model=MessageResponse,
           summary="Update insurance provider",
           description="Update information for an existing insurance provider. Requires admin privileges.")
async def update_insurance(
    insurance_id: int,
    data: InsuranceUpdate,
    current_user: Dict = Depends(get_current_admin)
):
    """
    Update an existing insurance provider's information.
    
    - **insurance_id**: ID of the insurance provider to update
    - **data**: Updated insurance information
    
    All fields are optional. Only provided fields will be updated.
    """
    # Build update query dynamically based on provided fields
    update_fields = []
    params = []
    
    if data.provider is not None:
        update_fields.append("provider = %s")
        params.append(data.provider)
        
    if data.policy_number is not None:
        update_fields.append("policy_number = %s")
        params.append(data.policy_number)
        
    if data.coverage_details is not None:
        update_fields.append("coverage_details = %s")
        params.append(data.coverage_details)
    
    if not update_fields:
        return {"message": "No fields to update"}
    
    # Add insurance_id to params
    params.append(insurance_id)
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE INSURANCE
                SET {", ".join(update_fields)}
                WHERE insurance_id = %s
                """,
                tuple(params)
            )
            
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Insurance provider not found"
                )
    
    return {"message": "Insurance provider updated successfully"}

@router.delete("/{insurance_id}", response_model=MessageResponse,
              summary="Delete insurance provider",
              description="Delete an insurance provider. Cannot delete if patients are using it. Requires admin privileges.")
async def delete_insurance(
    insurance_id: int,
    current_user: Dict = Depends(get_current_admin)
):
    """
    Delete an insurance provider from the system.
    
    - **insurance_id**: ID of the insurance provider to delete
    
    This operation will fail if there are patients currently using this insurance provider.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if insurance is used by any patients
            cursor.execute(
                """
                SELECT COUNT(*) as patient_count
                FROM PATIENTS
                WHERE insurance_id = %s
                """,
                (insurance_id,)
            )
            result = cursor.fetchone()
            
            if result["patient_count"] > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete insurance provider with assigned patients"
                )
            
            cursor.execute(
                """
                DELETE FROM INSURANCE
                WHERE insurance_id = %s
                """,
                (insurance_id,)
            )
            
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Insurance provider not found"
                )
    
    return {"message": "Insurance provider deleted successfully"} 