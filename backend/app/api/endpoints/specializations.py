from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.api.deps import get_current_user, get_current_admin
from app.config.database import db, DatabaseError
from datetime import datetime

# Create schemas for specialization operations
class SpecializationBase(BaseModel):
    spec_name: str

class SpecializationCreate(SpecializationBase):
    pass

class SpecializationUpdate(BaseModel):
    spec_name: Optional[str] = None

class SpecializationInDB(SpecializationBase):
    spec_id: int

class DoctorInSpecialization(BaseModel):
    doctor_id: int
    user_id: int
    first_name: str
    last_name: str
    email: str
    license_number: str
    department_id: int
    department_name: str

class SpecializationDetail(SpecializationInDB):
    doctors: List[DoctorInSpecialization] = []

router = APIRouter()

@router.get("", response_model=List[SpecializationInDB], 
            summary="Get all specializations",
            description="Retrieve a list of all medical specializations")
async def get_specializations(current_user: Dict = Depends(get_current_user)):
    """
    Get all specializations.
    
    Returns:
        List[SpecializationInDB]: A list of all specializations
    
    Example response:
    ```
    [
      {
        "spec_id": 1,
        "spec_name": "Cardiology"
      },
      {
        "spec_id": 2,
        "spec_name": "Neurology"
      }
    ]
    ```
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT spec_id, spec_name
                FROM specializations
                ORDER BY spec_name
                """
            )
            specializations = cursor.fetchall()
    
    return specializations

@router.get("/{specialization_id}", response_model=SpecializationDetail,
            summary="Get specialization details",
            description="Retrieve detailed information about a specific specialization including associated doctors")
async def get_specialization(specialization_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get a specialization by ID.
    
    Parameters:
        specialization_id (int): The ID of the specialization to retrieve
    
    Returns:
        SpecializationDetail: Detailed information about the specialization
    
    Example response:
    ```
    {
      "spec_id": 1,
      "spec_name": "Cardiology",
      "doctors": [
        {
          "doctor_id": 1,
          "user_id": 5,
          "first_name": "John",
          "last_name": "Doe",
          "email": "john.doe@example.com",
          "license_number": "MED12345",
          "department_id": 1,
          "department_name": "Internal Medicine"
        }
      ]
    }
    ```
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            # Get specialization details
            cursor.execute(
                """
                SELECT spec_id, spec_name
                FROM specializations
                WHERE spec_id = %s
                """,
                (specialization_id,)
            )
            specialization = cursor.fetchone()
            
            if specialization is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specialization not found"
                )
            
            # Get doctors with specialization
            cursor.execute(
                """
                SELECT d.doctor_id, d.user_id, u.first_name, u.last_name, u.email,
                       d.license_number, d.department_id, dept.department_name
                FROM doctors d
                JOIN users u ON d.user_id = u.user_id
                JOIN departments dept ON d.department_id = dept.department_id
                WHERE d.spec_id = %s
                """,
                (specialization_id,)
            )
            doctors = cursor.fetchall()
            
    # Add doctors to specialization
    specialization["doctors"] = doctors
    
    return specialization

@router.post("", response_model=SpecializationDetail, status_code=status.HTTP_201_CREATED,
             summary="Create a new specialization",
             description="Create a new medical specialization (admin only)")
async def create_specialization(specialization: SpecializationCreate, current_user: Dict = Depends(get_current_admin)):
    """
    Create a new specialization.
    
    Parameters:
        specialization (SpecializationCreate): The specialization data
    
    Returns:
        SpecializationDetail: The created specialization
    
    Example request:
    ```json
    {
      "spec_name": "Dermatology"
    }
    ```
    """
    try:
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                # Check if specialization name already exists
                cursor.execute(
                    "SELECT spec_id FROM specializations WHERE spec_name = %s",
                    (specialization.spec_name,)
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Specialization with name '{specialization.spec_name}' already exists"
                    )
                
                # Insert new specialization
                cursor.execute(
                    """
                    INSERT INTO specializations (spec_name)
                    VALUES (%s)
                    """,
                    (specialization.spec_name,)
                )
                
                spec_id = cursor.lastrowid
                
                # Get created specialization
                cursor.execute(
                    """
                    SELECT spec_id, spec_name
                    FROM specializations
                    WHERE spec_id = %s
                    """,
                    (spec_id,)
                )
                created_specialization = cursor.fetchone()
        
        # Add empty doctors list
        created_specialization["doctors"] = []
        
        return created_specialization
    except DatabaseError as e:
        # Check for duplicate entry error
        if "Duplicate entry" in str(e) and "spec_name" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Specialization with name '{specialization.spec_name}' already exists"
            )
        # Re-raise other database errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.put("/{specialization_id}", response_model=SpecializationInDB,
            summary="Update a specialization",
            description="Update an existing medical specialization (admin only)")
async def update_specialization(
    specialization_id: int,
    specialization: SpecializationUpdate,
    current_user: dict = Depends(get_current_admin)
):
    """
    Update a specialization.
    
    Parameters:
        specialization_id (int): The ID of the specialization to update
        specialization (SpecializationUpdate): The updated specialization data
    
    Returns:
        SpecializationInDB: The updated specialization
    
    Example request:
    ```json
    {
      "spec_name": "Updated Specialization Name"
    }
    ```
    """
    try:
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                # Check if specialization exists
                cursor.execute(
                    "SELECT spec_id FROM specializations WHERE spec_id = %s",
                    (specialization_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Specialization not found"
                    )
                
                # Check if specialization name already exists (if provided)
                if specialization.spec_name:
                    cursor.execute(
                        """
                        SELECT spec_id 
                        FROM specializations 
                        WHERE spec_name = %s AND spec_id != %s
                        """,
                        (specialization.spec_name, specialization_id)
                    )
                    if cursor.fetchone():
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Specialization with name '{specialization.spec_name}' already exists"
                        )
                
                # If no fields to update, return current specialization
                if specialization.spec_name is None:
                    cursor.execute(
                        """
                        SELECT spec_id, spec_name
                        FROM specializations
                        WHERE spec_id = %s
                        """,
                        (specialization_id,)
                    )
                    return cursor.fetchone()
                
                # Update specialization
                cursor.execute(
                    """
                    UPDATE specializations
                    SET spec_name = %s
                    WHERE spec_id = %s
                    """,
                    (specialization.spec_name, specialization_id)
                )
                
                # Get updated specialization
                cursor.execute(
                    """
                    SELECT spec_id, spec_name
                    FROM specializations
                    WHERE spec_id = %s
                    """,
                    (specialization_id,)
                )
                updated_specialization = cursor.fetchone()
        
        return updated_specialization
    except DatabaseError as e:
        # Check for duplicate entry error
        if "Duplicate entry" in str(e) and "spec_name" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Specialization with name '{specialization.spec_name}' already exists"
            )
        # Re-raise other database errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{specialization_id}", response_model=Dict,
               summary="Delete a specialization",
               description="Delete a medical specialization (admin only)")
async def delete_specialization(
    specialization_id: int, 
    current_user: dict = Depends(get_current_admin)
):
    """
    Delete a specialization.
    
    Parameters:
        specialization_id (int): The ID of the specialization to delete
    
    Returns:
        Dict: A message confirming the deletion
    
    Example response:
    ```json
    {
      "message": "Specialization deleted successfully"
    }
    ```
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if specialization exists
            cursor.execute(
                "SELECT spec_id FROM specializations WHERE spec_id = %s",
                (specialization_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specialization not found"
                )
            
            # Check if specialization is being used by doctors
            cursor.execute(
                "SELECT doctor_id FROM doctors WHERE spec_id = %s LIMIT 1",
                (specialization_id,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete specialization that is being used by doctors"
                )
            
            # Delete specialization
            cursor.execute(
                "DELETE FROM specializations WHERE spec_id = %s",
                (specialization_id,)
            )
    
    return {"message": "Specialization deleted successfully"} 