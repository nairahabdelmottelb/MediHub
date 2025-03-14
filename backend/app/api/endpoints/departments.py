from fastapi import APIRouter, Depends, HTTPException, status
from app.config.database import db
from pydantic import BaseModel
from typing import Dict, List, Optional
from ..deps import get_current_admin, get_current_user

# Create schemas for department operations
class DepartmentBase(BaseModel):
    department_name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = None

class DepartmentInDB(DepartmentBase):
    department_id: int

router = APIRouter()

@router.get("/", response_model=List[DepartmentInDB])
async def get_departments(current_user: Dict = Depends(get_current_user)):
    """
    Get all departments.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT department_id, department_name
                FROM departments
                ORDER BY department_id
                """
            )
            departments = cursor.fetchall()
    
    return departments

@router.get("/{department_id}", response_model=DepartmentInDB)
async def get_department(department_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get a specific department by ID.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT department_id, department_name
                FROM departments
                WHERE department_id = %s
                """,
                (department_id,)
            )
            department = cursor.fetchone()
    
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    
    return department

@router.post("/", response_model=DepartmentInDB)
async def create_department(department: DepartmentCreate, current_user: Dict = Depends(get_current_admin)):
    """
    Create a new department. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if department name already exists
            cursor.execute(
                "SELECT department_id FROM departments WHERE department_name = %s",
                (department.department_name,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Department name already exists"
                )
            
            # Insert new department
            cursor.execute(
                """
                INSERT INTO departments (department_name)
                VALUES (%s)
                """,
                (department.department_name,)
            )
            
            # Get the last inserted ID
            department_id = cursor.lastrowid
            
            # Get the complete department data
            cursor.execute(
                """
                SELECT department_id, department_name
                FROM departments
                WHERE department_id = %s
                """,
                (department_id,)
            )
            new_department = cursor.fetchone()
    
    return new_department

@router.put("/{department_id}", response_model=DepartmentInDB)
async def update_department(
    department_id: int, 
    department: DepartmentUpdate, 
    current_user: Dict = Depends(get_current_admin)
):
    """
    Update a department. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if department exists
            cursor.execute(
                "SELECT department_id FROM departments WHERE department_id = %s",
                (department_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Department not found"
                )
            
            # Check if department name already exists (if provided)
            if department.department_name:
                cursor.execute(
                    """
                    SELECT department_id 
                    FROM departments 
                    WHERE department_name = %s AND department_id != %s
                    """,
                    (department.department_name, department_id)
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Department name already exists"
                    )
            
            # If no fields to update, return current department
            if department.department_name is None:
                cursor.execute(
                    """
                    SELECT department_id, department_name
                    FROM departments
                    WHERE department_id = %s
                    """,
                    (department_id,)
                )
                return cursor.fetchone()
            
            # Update department
            cursor.execute(
                """
                UPDATE departments
                SET department_name = %s
                WHERE department_id = %s
                """,
                (department.department_name, department_id)
            )
            
            # Get updated department
            cursor.execute(
                """
                SELECT department_id, department_name
                FROM departments
                WHERE department_id = %s
                """,
                (department_id,)
            )
            updated_department = cursor.fetchone()
    
    return updated_department

@router.delete("/{department_id}", response_model=Dict)
async def delete_department(department_id: int, current_user: Dict = Depends(get_current_admin)):
    """
    Delete a department. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if department exists
            cursor.execute(
                "SELECT department_id FROM departments WHERE department_id = %s",
                (department_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Department not found"
                )
            
            # Check if department is being used by doctors
            cursor.execute(
                "SELECT doctor_id FROM doctors WHERE department_id = %s LIMIT 1",
                (department_id,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete department that is being used by doctors"
                )
            
            # Delete department
            cursor.execute(
                "DELETE FROM departments WHERE department_id = %s",
                (department_id,)
            )
    
    return {"message": "Department deleted successfully"} 