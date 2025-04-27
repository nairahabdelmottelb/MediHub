from fastapi import APIRouter, Depends, HTTPException, status
from app.config.database import db
from app.utils.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import Dict, List, Optional
from datetime import date
from ..deps import get_current_admin, get_current_user
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Create schemas for user operations
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_id: int
    phone: str
    # Optional fields for doctor creation
    department_id: Optional[int] = None
    spec_id: Optional[int] = None
    years_of_exp: Optional[int] = None
    # Optional fields for patient creation
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None

class DoctorCreate(UserBase):
    password: str
    phone: str
    department_id: int
    spec_id: int
    years_of_exp: int

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None

class UserInDB(BaseModel):
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role_id: int
    role_name: str

router = APIRouter()

@router.get("/me", response_model=Dict)
async def get_current_user_info(current_user: Dict = Depends(get_current_user)):
    """
    Get information about the currently authenticated user.
    Any authenticated user can access their own information.
    """
    logger.info(f"User requesting own info: {current_user['user_id']}")
    
    # Return a properly formatted user object that matches what the frontend expects
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "first_name": current_user["first_name"],
        "last_name": current_user["last_name"],
        "role_id": current_user["role_id"],
        "role_name": current_user["role_name"],
        "phone": current_user.get("phone", "")
    }

@router.get("/", response_model=List[Dict])
async def get_users(current_user: Dict = Depends(get_current_user)):
    """
    Get a list of all users.
    Only users with admin role can access this endpoint.
    """
    # Check if user has admin role
    if current_user.get("role_name", "").lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                """
            )
            users = cursor.fetchall()
    
    return users

@router.get("/{user_id}", response_model=Dict)
async def get_user(user_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get information about a specific user by ID.
    Any authenticated user can access this, but non-admins can only view users with appropriate permission.
    """
    # Regular users can only see their own info or public profiles
    if current_user.get("role_name", "").lower() != "admin" and str(current_user["user_id"]) != str(user_id):
        # For non-admin users, we might want to implement additional restrictions here
        # For example, doctors might be able to see their patients' profiles
        pass  # Implement additional permission logic here if needed

    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.user_id = %s
                """,
                (user_id,)
            )
            user = cursor.fetchone()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/", response_model=UserInDB)
async def create_user(user: UserCreate, current_user: Dict = Depends(get_current_admin)):
    """
    Create a new user. Admin only.
    
    If role_id corresponds to a doctor, the following fields are required:
    - department_id: Department ID from DEPARTMENTS table
    - spec_id: Specialization ID from SPECIALIZATIONS table
    - years_of_exp: Years of experience (integer)
    
    If role_id corresponds to a patient, the following fields are required:
    - date_of_birth: Date of birth (YYYY-MM-DD)
    - gender: Gender (Male, Female, Other)
    - blood_type: Blood type (optional: A+, A-, B+, B-, AB+, AB-, O+, O-)
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if email already exists
            cursor.execute(
                "SELECT user_id FROM users WHERE email = %s",
                (user.email,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Check if role exists
            cursor.execute(
                "SELECT role_id, role_name FROM roles WHERE role_id = %s",
                (user.role_id,)
            )
            role = cursor.fetchone()
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role does not exist"
                )
            
            # Check if this is a doctor role (case-insensitive comparison)
            is_doctor = role['role_name'].lower() == 'doctor'
            
            # Check if this is a patient role (case-insensitive comparison)
            is_patient = role['role_name'].lower() == 'patient'
            
            # If creating a doctor, validate doctor-specific fields
            if is_doctor:
                if not user.department_id or not user.spec_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Doctor creation requires department_id and spec_id"
                    )
                
                # Validate department_id
                cursor.execute(
                    "SELECT department_id FROM departments WHERE department_id = %s",
                    (user.department_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Department with ID {user.department_id} does not exist"
                    )
                
                # Validate spec_id
                cursor.execute(
                    "SELECT spec_id FROM specializations WHERE spec_id = %s",
                    (user.spec_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Specialization with ID {user.spec_id} does not exist"
                    )
            
            # If creating a patient, validate patient-specific fields
            if is_patient:
                if not user.date_of_birth or not user.gender:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Patient creation requires date_of_birth and gender"
                    )
                
                # Validate gender
                valid_genders = ['Male', 'Female', 'Other']
                if user.gender not in valid_genders:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Gender must be one of: {', '.join(valid_genders)}"
                    )
                
                # Validate blood_type if provided
                if user.blood_type:
                    valid_blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
                    if user.blood_type not in valid_blood_types:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Blood type must be one of: {', '.join(valid_blood_types)}"
                        )
            
            # Hash the password
            hashed_password = get_password_hash(user.password)
            
            # Insert new user
            cursor.execute(
                """
                INSERT INTO users (email, password, first_name, last_name, phone, role_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    user.email,
                    hashed_password,
                    user.first_name,
                    user.last_name,
                    user.phone,
                    user.role_id
                )
            )
            
            # Get the last inserted ID
            user_id = cursor.lastrowid
            
            # If this is a doctor, insert into DOCTORS table
            if is_doctor:
                cursor.execute(
                    """
                    INSERT INTO doctors (user_id, spec_id, department_id, years_of_exp)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        user_id,
                        user.spec_id,
                        user.department_id,
                        user.years_of_exp or 0  # Default to 0 if not provided
                    )
                )
                
                logger.info(f"Created doctor with user_id {user_id}")
                
            # If this is a patient, insert into PATIENTS table
            if is_patient:
                if user.blood_type:
                    cursor.execute(
                        """
                        INSERT INTO PATIENTS (user_id, date_of_birth, gender, blood_type)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            user_id,
                            user.date_of_birth,
                            user.gender,
                            user.blood_type
                        )
                    )
                else:
                    cursor.execute(
                        """
                        INSERT INTO PATIENTS (user_id, date_of_birth, gender)
                        VALUES (%s, %s, %s)
                        """,
                        (
                            user_id,
                            user.date_of_birth,
                            user.gender
                        )
                    )
                
                logger.info(f"Created patient with user_id {user_id}")
            
            # Get the complete user data
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, 
                       u.phone, u.role_id, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.user_id = %s
                """,
                (user_id,)
            )
            new_user = cursor.fetchone()
    
    return new_user

@router.put("/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: int, 
    user: UserUpdate, 
    current_user: Dict = Depends(get_current_admin)
):
    """
    Update a user. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if user exists
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = %s",
                (user_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Check if email already exists (if provided)
            if user.email:
                cursor.execute(
                    "SELECT user_id FROM users WHERE email = %s AND user_id != %s",
                    (user.email, user_id)
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )
            
            # Check if role exists (if provided)
            if user.role_id:
                cursor.execute(
                    "SELECT role_id FROM roles WHERE role_id = %s",
                    (user.role_id,)
                )
                if not cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Role does not exist"
                    )
            
            # Build update query dynamically
            update_fields = []
            params = []
            
            if user.email is not None:
                update_fields.append("email = %s")
                params.append(user.email)
            
            if user.first_name is not None:
                update_fields.append("first_name = %s")
                params.append(user.first_name)
            
            if user.last_name is not None:
                update_fields.append("last_name = %s")
                params.append(user.last_name)
            
            if user.phone is not None:
                update_fields.append("phone = %s")
                params.append(user.phone)
            
            if user.role_id is not None:
                update_fields.append("role_id = %s")
                params.append(user.role_id)
            
            # If no fields to update, return current user
            if not update_fields:
                cursor.execute(
                    """
                    SELECT u.user_id, u.email, u.first_name, u.last_name, 
                           u.phone, u.role_id, r.role_name
                    FROM users u
                    JOIN roles r ON u.role_id = r.role_id
                    WHERE u.user_id = %s
                    """,
                    (user_id,)
                )
                return cursor.fetchone()
            
            # Add user_id to params
            params.append(user_id)
            
            # Update user
            cursor.execute(
                f"""
                UPDATE users
                SET {", ".join(update_fields)}
                WHERE user_id = %s
                """,
                tuple(params)
            )
            
            # Get updated user
            cursor.execute(
                """
                SELECT u.user_id, u.email, u.first_name, u.last_name, 
                       u.phone, u.role_id, r.role_name
                FROM users u
                JOIN roles r ON u.role_id = r.role_id
                WHERE u.user_id = %s
                """,
                (user_id,)
            )
            updated_user = cursor.fetchone()
    
    return updated_user

@router.delete("/{user_id}", response_model=Dict)
async def delete_user(user_id: int, current_user: Dict = Depends(get_current_admin)):
    """
    Delete a user. Admin only.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if user exists
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = %s",
                (user_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Delete user
            cursor.execute(
                "DELETE FROM users WHERE user_id = %s",
                (user_id,)
            )
    
    return {"message": "User deleted successfully"}

@router.get("/roles/doctor", response_model=Dict, include_in_schema=False)
async def get_doctor_role_id(current_user: Dict = Depends(get_current_user)):
    """
    Get the role_id for the 'doctor' role.
    This helps clients to know which role_id to use when creating a doctor.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT role_id FROM roles WHERE LOWER(role_name) = 'doctor'"
            )
            role = cursor.fetchone()
    
    if not role:
        return {"message": "Doctor role not found in the database"}
    
    return {"role_id": role["role_id"], "role_name": "doctor"}

@router.get("/doctor-data", response_model=Dict, include_in_schema=False)
async def get_doctor_reference_data(current_user: Dict = Depends(get_current_user)):
    """
    Get all necessary reference data for creating a doctor user:
    - Doctor role ID
    - Available departments
    - Available specializations
    
    This endpoint combines all the needed data in one call for convenience.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            # Get doctor role ID
            cursor.execute(
                "SELECT role_id FROM roles WHERE LOWER(role_name) = 'doctor'"
            )
            role = cursor.fetchone()
            doctor_role_id = role["role_id"] if role else None
            
            # Get departments
            cursor.execute(
                "SELECT department_id, department_name FROM departments ORDER BY department_name"
            )
            departments = cursor.fetchall()
            
            # Get specializations
            cursor.execute(
                "SELECT spec_id, spec_name, description FROM specializations ORDER BY spec_name"
            )
            specializations = cursor.fetchall()
    
    return {
        "doctor_role_id": doctor_role_id,
        "departments": departments,
        "specializations": specializations
    }

@router.get("/roles/patient", response_model=Dict, include_in_schema=False)
async def get_patient_role_id(current_user: Dict = Depends(get_current_user)):
    """
    Get the role_id for the 'patient' role.
    This helps clients to know which role_id to use when creating a patient.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT role_id FROM roles WHERE LOWER(role_name) = 'patient'"
            )
            role = cursor.fetchone()
    
    if not role:
        return {"message": "Patient role not found in the database"}
    
    return {"role_id": role["role_id"], "role_name": "patient"} 