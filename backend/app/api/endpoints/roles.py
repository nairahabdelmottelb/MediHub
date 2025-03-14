from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional
from app.schemas import (
    RoleCreate, 
    RoleDetail, 
    RoleList, 
    RoleUpdate,
    Message
)
from app.api.deps import get_current_user, get_current_admin
from app.config.database import db
from datetime import datetime
from app.utils.security import get_password_hash
from pydantic import BaseModel

# Create a schema for roles based on the actual database schema
class RoleBase(BaseModel):
    role_name: str
    # Remove description field as it doesn't exist in the database

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    role_name: Optional[str] = None

class RoleInDB(RoleBase):
    role_id: int

router = APIRouter()

@router.get("/", response_model=List[RoleInDB])
async def get_roles(current_user: Dict = Depends(get_current_user)):
    """
    Get all roles.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT role_id, role_name
                FROM roles
                ORDER BY role_id
                """
            )
            roles = cursor.fetchall()
    
    return roles

@router.get("/{role_id}", response_model=RoleInDB)
async def get_role(role_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get a specific role by ID.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT role_id, role_name
                FROM roles
                WHERE role_id = %s
                """,
                (role_id,)
            )
            role = cursor.fetchone()
    
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    return role

@router.post("/", response_model=RoleInDB)
async def create_role(role: RoleCreate, current_user: Dict = Depends(get_current_admin)):
    """
    Create a new role. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if role name already exists
            cursor.execute(
                "SELECT role_id FROM roles WHERE role_name = %s",
                (role.role_name,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role name already exists"
                )
            
            # Insert new role
            cursor.execute(
                """
                INSERT INTO roles (role_name)
                VALUES (%s)
                """,
                (role.role_name,)
            )
            
            # Get the last inserted ID
            role_id = cursor.lastrowid
            
            # Get the complete role data
            cursor.execute(
                """
                SELECT role_id, role_name
                FROM roles
                WHERE role_id = %s
                """,
                (role_id,)
            )
            new_role = cursor.fetchone()
    
    return new_role

@router.put("/{role_id}", response_model=RoleInDB)
async def update_role(
    role_id: int, 
    role: RoleUpdate, 
    current_user: Dict = Depends(get_current_admin)
):
    """
    Update a role. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if role exists
            cursor.execute(
                "SELECT role_id FROM roles WHERE role_id = %s",
                (role_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Role not found"
                )
            
            # Check if new role name already exists (if provided)
            if role.role_name:
                cursor.execute(
                    "SELECT role_id FROM roles WHERE role_name = %s AND role_id != %s",
                    (role.role_name, role_id)
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Role name already exists"
                    )
            
            # Update role
            if role.role_name is not None:
                cursor.execute(
                    """
                    UPDATE roles
                    SET role_name = %s
                    WHERE role_id = %s
                    """,
                    (role.role_name, role_id)
                )
            
            # Get updated role
            cursor.execute(
                """
                SELECT role_id, role_name
                FROM roles
                WHERE role_id = %s
                """,
                (role_id,)
            )
            updated_role = cursor.fetchone()
    
    return updated_role

@router.delete("/{role_id}", response_model=Dict)
async def delete_role(role_id: int, current_user: Dict = Depends(get_current_admin)):
    """
    Delete a role. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if role exists
            cursor.execute(
                "SELECT role_id FROM roles WHERE role_id = %s",
                (role_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Role not found"
                )
            
            # Check if role is in use
            cursor.execute(
                "SELECT COUNT(*) as count FROM users WHERE role_id = %s",
                (role_id,)
            )
            result = cursor.fetchone()
            if result and result["count"] > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete role that is assigned to users"
                )
            
            # Delete role
            cursor.execute(
                "DELETE FROM roles WHERE role_id = %s",
                (role_id,)
            )
    
    return {"message": "Role deleted successfully"} 