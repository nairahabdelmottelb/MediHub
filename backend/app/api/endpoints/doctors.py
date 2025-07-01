from fastapi import APIRouter, Depends, HTTPException, status, Body
from ...config.database import db
from ..deps import get_current_user, get_current_admin, get_current_doctor
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timedelta, time
from app.schemas.doctor import DoctorCreate, DoctorResponse, DoctorUpdate
from app.schemas.user import UserCreate
from app.utils.security import security

# Create schemas for doctor calendar operations
class CalendarCreate(BaseModel):
    availability: bool = True

class TimeSlotCreate(BaseModel):
    date: str
    start_hour: int = Field(9, description="Hour to start creating slots (24-hour format)")
    end_hour: int = Field(17, description="Hour to end creating slots (24-hour format)")
    duration_minutes: int = Field(30, description="Duration of each slot in minutes")

class BulkTimeSlotCreate(BaseModel):
    start_date: str
    end_date: str
    start_time: str
    end_time: str
    slot_duration_minutes: int = 30
    weekdays: List[int] = Field([0, 1, 2, 3, 4], description="Days of week (0=Monday, 6=Sunday)")
    exclude_dates: List[str] = Field([], description="Dates to exclude (format: YYYY-MM-DD)")

# Create schemas for doctor schedule operations
class ScheduleTimeSlot(BaseModel):
    day_of_week: int = Field(..., description="Day of week (0=Monday, 6=Sunday)", ge=0, le=6)
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")
    is_available: bool = Field(True, description="Whether this time slot is available for booking")

class DoctorScheduleCreate(BaseModel):
    schedule_slots: List[ScheduleTimeSlot] = Field(..., description="List of recurring time slots")

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("")
async def get_doctors():
    """
    Get all doctors.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT d.doctor_id, u.first_name, u.last_name, 
                       u.email, u.phone, d.years_of_exp,
                       s.spec_id, s.spec_name,
                       dep.department_id, dep.department_name
                FROM DOCTORS d
                JOIN USERS u ON d.user_id = u.user_id
                JOIN SPECIALIZATIONS s ON d.spec_id = s.spec_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                ORDER BY u.last_name, u.first_name
                """
            )
            return cursor.fetchall()

@router.get("/{doctor_id}")
async def get_doctor(doctor_id: int):
    """
    Get a specific doctor by ID.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT d.doctor_id, u.first_name, u.last_name, 
                       u.email, u.phone, d.years_of_exp,
                       s.spec_id, s.spec_name,
                       dep.department_id, dep.department_name
                FROM DOCTORS d
                JOIN USERS u ON d.user_id = u.user_id
                JOIN SPECIALIZATIONS s ON d.spec_id = s.spec_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                WHERE d.doctor_id = %s
                """,
                (doctor_id,)
            )
            doctor = cursor.fetchone()
            
            if not doctor:
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )
            
            # Get doctor's calendar
            cursor.execute(
                """
                SELECT calendar_id, availability 
                FROM DOCTOR_CALENDAR
                WHERE doctor_id = %s
                """,
                (doctor_id,)
            )
            calendar = cursor.fetchone()
            doctor["calendar"] = calendar
            
            # Get doctor's timeslots if calendar exists
            if calendar:
                cursor.execute(
                    """
                    SELECT slot_id, start_time, end_time, is_available
                    FROM TIMESLOTS
                    WHERE calendar_id = %s
                    ORDER BY start_time
                    """,
                    (calendar["calendar_id"],)
                )
                doctor["timeslots"] = cursor.fetchall()
            else:
                doctor["timeslots"] = []
            
            return doctor

@router.post("/{doctor_id}/calendar", 
             response_model=Dict,
             summary="Create doctor calendar",
             description="Create a calendar for a doctor (admin or the doctor only)")
async def create_doctor_calendar(
    doctor_id: int,
    data: CalendarCreate = Body(..., example={"availability": True}),
    current_user: Dict = Depends(get_current_user)
):
    """
    Create a calendar for a doctor.
    
    Only the doctor themselves or an admin can create a calendar.
    """
    # Check if user is the doctor or an admin
    is_authorized = False
    if current_user["role_name"] == "admin":
        is_authorized = True
    elif current_user["role_name"] == "doctor":
        # Check if current user is the doctor
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id FROM DOCTORS
                    WHERE doctor_id = %s
                    """,
                    (doctor_id,)
                )
                doctor = cursor.fetchone()
                if doctor and doctor["user_id"] == current_user["user_id"]:
                    is_authorized = True
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create calendar for this doctor"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if doctor exists
            cursor.execute(
                """
                SELECT * FROM DOCTORS
                WHERE doctor_id = %s
                """,
                (doctor_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )
            
            # Check if calendar already exists
            cursor.execute(
                """
                SELECT * FROM DOCTOR_CALENDAR
                WHERE doctor_id = %s
                """,
                (doctor_id,)
            )
            existing_calendar = cursor.fetchone()
            
            if existing_calendar:
                calendar_id = existing_calendar["calendar_id"]
                # Update existing calendar
                cursor.execute(
                    """
                    UPDATE DOCTOR_CALENDAR
                    SET availability = %s
                    WHERE calendar_id = %s
                    """,
                    (data.availability, calendar_id)
                )
                message = "Calendar updated successfully"
            else:
                # Create new calendar
                cursor.execute(
                    """
                    INSERT INTO DOCTOR_CALENDAR (doctor_id, availability)
                    VALUES (%s, %s)
                    """,
                    (doctor_id, data.availability)
                )
                calendar_id = cursor.lastrowid
                message = "Calendar created successfully"
            
            # Get updated calendar
            cursor.execute(
                """
                SELECT * FROM DOCTOR_CALENDAR
                WHERE calendar_id = %s
                """,
                (calendar_id,)
            )
            calendar = cursor.fetchone()
    
    return {
        "calendar_id": calendar_id,
        "doctor_id": doctor_id,
        "availability": calendar["availability"],
        "message": message
    }

@router.post("/{doctor_id}/timeslots", 
             response_model=Dict,
             summary="Create timeslots for doctor",
             description="Create timeslots for a doctor's calendar (admin or the doctor only)")
async def create_doctor_timeslots(
    doctor_id: int,
    data: TimeSlotCreate = Body(..., 
        example={
            "date": "2023-12-01",
            "start_hour": 9,
            "end_hour": 17,
            "duration_minutes": 30
        }
    ),
    current_user: Dict = Depends(get_current_user)
):
    """
    Create timeslots for a doctor's calendar.
    
    Only the doctor themselves or an admin can create timeslots.
    """
    # Check if user is the doctor or an admin
    is_authorized = False
    if current_user["role_name"] == "admin":
        is_authorized = True
    elif current_user["role_name"] == "doctor":
        # Check if current user is the doctor
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id FROM DOCTORS
                    WHERE doctor_id = %s
                    """,
                    (doctor_id,)
                )
                doctor = cursor.fetchone()
                if doctor and doctor["user_id"] == current_user["user_id"]:
                    is_authorized = True
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create timeslots for this doctor"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Get doctor's calendar
            cursor.execute(
                """
                SELECT * FROM DOCTOR_CALENDAR
                WHERE doctor_id = %s
                """,
                (doctor_id,)
            )
            calendar = cursor.fetchone()
            
            if not calendar:
                # Create calendar if it doesn't exist
                cursor.execute(
                    """
                    INSERT INTO DOCTOR_CALENDAR (
                        doctor_id, availability
                    ) VALUES (%s, %s)
                    """,
                    (doctor_id, True)
                )
                calendar_id = cursor.lastrowid
            else:
                calendar_id = calendar["calendar_id"]
            
            # Create time slots
            created_slots = []
            
            # Parse date
            try:
                date_obj = datetime.strptime(data.date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Use YYYY-MM-DD"
                )
            
            start_hour = data.start_hour
            end_hour = data.end_hour
            duration_minutes = data.duration_minutes
            
            # Create slots for the specified day
            current_time = datetime.combine(date_obj, time(hour=start_hour))
            end_time = datetime.combine(date_obj, time(hour=end_hour))
            
            while current_time < end_time:
                slot_end = current_time + timedelta(minutes=duration_minutes)
                
                # Check for overlaps
                cursor.execute(
                    """
                    SELECT slot_id
                    FROM TIMESLOTS
                    WHERE calendar_id = %s AND (
                        (start_time <= %s AND end_time > %s) OR
                        (start_time < %s AND end_time >= %s) OR
                        (start_time >= %s AND end_time <= %s)
                    )
                    """,
                    (
                        calendar_id,
                        current_time, current_time,
                        slot_end, slot_end,
                        current_time, slot_end
                    )
                )
                if not cursor.fetchone():
                    try:
                        cursor.execute(
                            """
                            INSERT INTO TIMESLOTS (
                                calendar_id, start_time, end_time, is_available
                            ) VALUES (%s, %s, %s, %s)
                            """,
                            (calendar_id, current_time, slot_end, True)
                        )
                        
                        created_slots.append({
                            "slot_id": cursor.lastrowid,
                            "start_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                            "end_time": slot_end.strftime("%Y-%m-%d %H:%M:%S"),
                            "is_available": True
                        })
                    except Exception as e:
                        logger.error(f"Error creating timeslot: {str(e)}")
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Error creating timeslot: {str(e)}"
                        )
                
                current_time = slot_end
    
    return {
        "calendar_id": calendar_id,
        "created_slots": created_slots,
        "message": f"Successfully created {len(created_slots)} timeslots"
    }

@router.post("/{doctor_id}/bulk-timeslots", 
             response_model=Dict,
             summary="Create bulk timeslots for doctor",
             description="Create multiple timeslots for a doctor's calendar over a date range (admin or the doctor only)")
async def create_bulk_doctor_timeslots(
    doctor_id: int,
    data: BulkTimeSlotCreate = Body(..., 
        example={
            "start_date": "2023-12-01",
            "end_date": "2023-12-07",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "weekdays": [0, 1, 2, 3, 4],
            "exclude_dates": ["2023-12-03"]
        }
    ),
    current_user: Dict = Depends(get_current_user)
):
    """
    Create multiple timeslots for a doctor's calendar over a date range.
    
    Only the doctor themselves or an admin can create timeslots.
    """
    # Check if user is the doctor or an admin
    is_authorized = False
    if current_user["role_name"] == "admin":
        is_authorized = True
    elif current_user["role_name"] == "doctor":
        # Check if current user is the doctor
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id FROM DOCTORS
                    WHERE doctor_id = %s
                    """,
                    (doctor_id,)
                )
                doctor = cursor.fetchone()
                if doctor and doctor["user_id"] == current_user["user_id"]:
                    is_authorized = True
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create timeslots for this doctor"
        )
    
    # Parse dates and times
    try:
        start_date = datetime.strptime(data.start_date, "%Y-%m-%d").date()
        end_date = datetime.strptime(data.end_date, "%Y-%m-%d").date()
        
        # Parse time strings properly
        start_time_parts = data.start_time.split(":")
        end_time_parts = data.end_time.split(":")
        
        # Create time objects
        start_time_obj = time(
            hour=int(start_time_parts[0]), 
            minute=int(start_time_parts[1]), 
            second=int(start_time_parts[2]) if len(start_time_parts) > 2 else 0
        )
        end_time_obj = time(
            hour=int(end_time_parts[0]), 
            minute=int(end_time_parts[1]), 
            second=int(end_time_parts[2]) if len(end_time_parts) > 2 else 0
        )
        
        slot_duration = timedelta(minutes=data.slot_duration_minutes)
        weekdays = data.weekdays
        exclude_dates = [datetime.strptime(d, "%Y-%m-%d").date() for d in data.exclude_dates]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date or time format: {str(e)}. Use YYYY-MM-DD for dates and HH:MM:SS for times"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Get doctor's calendar
            cursor.execute(
                """
                SELECT * FROM DOCTOR_CALENDAR
                WHERE doctor_id = %s
                """,
                (doctor_id,)
            )
            calendar = cursor.fetchone()
            
            if not calendar:
                # Create calendar if it doesn't exist
                cursor.execute(
                    """
                    INSERT INTO DOCTOR_CALENDAR (
                        doctor_id, availability
                    ) VALUES (%s, %s)
                    """,
                    (doctor_id, True)
                )
                calendar_id = cursor.lastrowid
            else:
                calendar_id = calendar["calendar_id"]
            
            # Create timeslots
            created_count = 0
            current_date = start_date
            
            while current_date <= end_date:
                # Skip if not in selected weekdays or in excluded dates
                if current_date.weekday() not in weekdays or current_date in exclude_dates:
                    current_date += timedelta(days=1)
                    continue
                
                # Create slots for this day
                day_start = datetime.combine(current_date, start_time_obj)
                day_end = datetime.combine(current_date, end_time_obj)
                
                slot_start = day_start
                while slot_start + slot_duration <= day_end:
                    slot_end = slot_start + slot_duration
                    
                    # Check for overlaps
                    cursor.execute(
                        """
                        SELECT slot_id
                        FROM TIMESLOTS
                        WHERE calendar_id = %s AND (
                            (start_time <= %s AND end_time > %s) OR
                            (start_time < %s AND end_time >= %s) OR
                            (start_time >= %s AND end_time <= %s)
                        )
                        """,
                        (
                            calendar_id,
                            slot_start, slot_start,
                            slot_end, slot_end,
                            slot_start, slot_end
                        )
                    )
                    if not cursor.fetchone():
                        try:
                            # Create timeslot
                            cursor.execute(
                                """
                                INSERT INTO TIMESLOTS (calendar_id, start_time, end_time, is_available)
                                VALUES (%s, %s, %s, %s)
                                """,
                                (
                                    calendar_id,
                                    slot_start,
                                    slot_end,
                                    True
                                )
                            )
                            created_count += 1
                        except Exception as e:
                            logger.error(f"Error creating timeslot: {str(e)}")
                            # Continue with other slots instead of failing completely
                            pass
                    
                    slot_start = slot_end
                
                current_date += timedelta(days=1)
    
    return {
        "calendar_id": calendar_id,
        "created_count": created_count,
        "message": f"Successfully created {created_count} timeslots"
    }

@router.post("/{doctor_id}/schedule", 
             response_model=Dict,
             summary="Create doctor's weekly schedule",
             description="Set up a doctor's recurring weekly schedule (admin or the doctor only)")
async def create_doctor_schedule(
    doctor_id: int,
    data: DoctorScheduleCreate = Body(..., 
        examples={
            "standard_week": {
                "summary": "Standard weekday schedule",
                "description": "Create a standard weekday schedule with morning and afternoon sessions",
                "value": {
                    "schedule_slots": [
                        {"day_of_week": 0, "start_time": "09:00", "end_time": "12:00", "is_available": True},
                        {"day_of_week": 0, "start_time": "13:00", "end_time": "17:00", "is_available": True},
                        {"day_of_week": 1, "start_time": "09:00", "end_time": "12:00", "is_available": True},
                        {"day_of_week": 1, "start_time": "13:00", "end_time": "17:00", "is_available": True},
                        {"day_of_week": 2, "start_time": "09:00", "end_time": "12:00", "is_available": True},
                        {"day_of_week": 2, "start_time": "13:00", "end_time": "17:00", "is_available": True},
                        {"day_of_week": 3, "start_time": "09:00", "end_time": "12:00", "is_available": True},
                        {"day_of_week": 3, "start_time": "13:00", "end_time": "17:00", "is_available": True},
                        {"day_of_week": 4, "start_time": "09:00", "end_time": "12:00", "is_available": True},
                        {"day_of_week": 4, "start_time": "13:00", "end_time": "17:00", "is_available": True}
                    ]
                }
            },
            "part_time": {
                "summary": "Part-time schedule",
                "description": "Create a part-time schedule for mornings only on Monday, Wednesday, Friday",
                "value": {
                    "schedule_slots": [
                        {"day_of_week": 0, "start_time": "08:00", "end_time": "12:00", "is_available": True},
                        {"day_of_week": 2, "start_time": "08:00", "end_time": "12:00", "is_available": True},
                        {"day_of_week": 4, "start_time": "08:00", "end_time": "12:00", "is_available": True}
                    ]
                }
            },
            "weekend_only": {
                "summary": "Weekend only schedule",
                "description": "Create a weekend-only schedule for Saturday and Sunday",
                "value": {
                    "schedule_slots": [
                        {"day_of_week": 5, "start_time": "10:00", "end_time": "16:00", "is_available": True},
                        {"day_of_week": 6, "start_time": "10:00", "end_time": "14:00", "is_available": True}
                    ]
                }
            }
        }
    ),
    current_user: Dict = Depends(get_current_user)
):
    """
    Create a recurring weekly schedule for a doctor.
    
    This sets up the doctor's regular working hours that repeat every week.
    Only the doctor themselves or an admin can create a schedule.
    """
    # Check if user is the doctor or an admin
    is_authorized = False
    if current_user["role_name"] == "admin":
        is_authorized = True
    elif current_user["role_name"] == "doctor":
        # Check if current user is the doctor
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id FROM DOCTORS
                    WHERE doctor_id = %s
                    """,
                    (doctor_id,)
                )
                doctor = cursor.fetchone()
                if doctor and doctor["user_id"] == current_user["user_id"]:
                    is_authorized = True
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create schedule for this doctor"
        )
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if doctor exists
            cursor.execute(
                """
                SELECT * FROM DOCTORS
                WHERE doctor_id = %s
                """,
                (doctor_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )
            
            # Delete existing schedule if any
            cursor.execute(
                """
                DELETE FROM DOCTOR_SCHEDULE
                WHERE doctor_id = %s
                """,
                (doctor_id,)
            )
            
            # Insert new schedule slots
            created_slots = []
            for slot in data.schedule_slots:
                try:
                    # Parse times
                    start_time_obj = datetime.strptime(slot.start_time, "%H:%M").time()
                    end_time_obj = datetime.strptime(slot.end_time, "%H:%M").time()
                    
                    # Validate times
                    if start_time_obj >= end_time_obj:
                        raise ValueError("Start time must be before end time")
                    
                    cursor.execute(
                        """
                        INSERT INTO DOCTOR_SCHEDULE (
                            doctor_id, day_of_week, start_time, end_time, is_available
                        ) VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            doctor_id,
                            slot.day_of_week,
                            start_time_obj,
                            end_time_obj,
                            slot.is_available
                        )
                    )
                    
                    created_slots.append({
                        "schedule_id": cursor.lastrowid,
                        "day_of_week": slot.day_of_week,
                        "start_time": slot.start_time,
                        "end_time": slot.end_time,
                        "is_available": slot.is_available
                    })
                except ValueError as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid time format or values: {str(e)}"
                    )
                except Exception as e:
                    logger.error(f"Error creating schedule slot: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error creating schedule slot: {str(e)}"
                    )
    
    return {
        "doctor_id": doctor_id,
        "created_slots": created_slots,
        "message": f"Successfully created {len(created_slots)} schedule slots"
    }

@router.post("/", response_model=DoctorResponse)
async def create_doctor(doctor: DoctorCreate, current_user: Dict = Depends(get_current_admin)):
    """
    Create a new doctor with associated user account.
    Only admin users can create doctors.
    """
    # Start transaction for creating both user and doctor records
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if email already exists
            cursor.execute(
                "SELECT user_id FROM USERS WHERE email = %s",
                (doctor.email,)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
            
            # Create user account first
            hashed_password = security.get_password_hash(doctor.password)
            
            # Get doctor role_id
            cursor.execute(
                "SELECT role_id FROM ROLES WHERE role_name = 'Doctor'"
            )
            role_result = cursor.fetchone()
            if not role_result:
                raise HTTPException(
                    status_code=500,
                    detail="Doctor role not found"
                )
            doctor_role_id = role_result["role_id"]
            
            # Insert user
            cursor.execute(
                """
                INSERT INTO USERS (
                    email, password, first_name, last_name, 
                    role_id, phone
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    doctor.email,
                    hashed_password,
                    doctor.first_name,
                    doctor.last_name,
                    doctor_role_id,
                    doctor.phone_number,
                )
            )
            
            # Get the new user ID
            user_id = cursor.lastrowid
            
            # Get specialty ID from specialty name
            cursor.execute(
                "SELECT spec_id FROM SPECIALIZATIONS WHERE spec_name = %s",
                (doctor.specialty,)
            )
            spec_result = cursor.fetchone()
            if not spec_result:
                raise HTTPException(
                    status_code=400,
                    detail=f"Specialty '{doctor.specialty}' not found"
                )
            spec_id = spec_result["spec_id"]
            
            # Use provided department_id or get the first available department
            if doctor.department_id:
                # Verify the department exists
                cursor.execute(
                    "SELECT department_id FROM DEPARTMENTS WHERE department_id = %s",
                    (doctor.department_id,)
                )
                dept_result = cursor.fetchone()
                if not dept_result:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Department with ID {doctor.department_id} not found"
                    )
                department_id = doctor.department_id
            else:
                # Get the first available department as fallback
                cursor.execute(
                    "SELECT department_id FROM DEPARTMENTS LIMIT 1"
                )
                dept_result = cursor.fetchone()
                if not dept_result:
                    raise HTTPException(
                        status_code=500,
                        detail="No departments found"
                    )
                department_id = dept_result["department_id"]
            
            # Now create the doctor record
            cursor.execute(
                """
                INSERT INTO DOCTORS (
                    user_id, spec_id, department_id, years_of_exp
                ) VALUES (%s, %s, %s, %s)
                """,
                (
                    user_id,
                    spec_id,
                    department_id,
                    doctor.years_of_experience
                )
            )
            
            # Get the new doctor ID
            doctor_id = cursor.lastrowid
            
            # Return the complete doctor information
            cursor.execute(
                """
                SELECT 
                    d.doctor_id, u.user_id, u.email, u.first_name, u.last_name,
                    u.phone, d.years_of_exp,
                    s.spec_id, s.spec_name,
                    dep.department_id, dep.department_name
                FROM DOCTORS d
                JOIN USERS u ON d.user_id = u.user_id
                JOIN SPECIALIZATIONS s ON d.spec_id = s.spec_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                WHERE d.doctor_id = %s
                """,
                (doctor_id,)
            )
            
            new_doctor = cursor.fetchone()
    
    return new_doctor 

@router.put("/{doctor_id}", response_model=DoctorResponse)
async def update_doctor(doctor_id: int, doctor: DoctorUpdate, current_user: Dict = Depends(get_current_admin)):
    """
    Update an existing doctor.
    Only admin users can update doctors.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if doctor exists
            cursor.execute(
                """
                SELECT d.doctor_id, d.user_id, u.email 
                FROM DOCTORS d
                JOIN USERS u ON d.user_id = u.user_id
                WHERE d.doctor_id = %s
                """,
                (doctor_id,)
            )
            existing_doctor = cursor.fetchone()
            if not existing_doctor:
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )
            
            user_id = existing_doctor["user_id"]
            
            # Check if email is being changed and if it's already taken
            if doctor.email and doctor.email != existing_doctor["email"]:
                cursor.execute(
                    "SELECT user_id FROM USERS WHERE email = %s AND user_id != %s",
                    (doctor.email, user_id)
                )
                if cursor.fetchone():
                    raise HTTPException(
                        status_code=400,
                        detail="Email already registered"
                    )
            
            # Update user information
            user_updates = []
            user_params = []
            
            if doctor.first_name:
                user_updates.append("first_name = %s")
                user_params.append(doctor.first_name)
            if doctor.last_name:
                user_updates.append("last_name = %s")
                user_params.append(doctor.last_name)
            if doctor.email:
                user_updates.append("email = %s")
                user_params.append(doctor.email)
            if doctor.phone_number is not None:
                user_updates.append("phone = %s")
                user_params.append(doctor.phone_number)
            if doctor.password:
                hashed_password = security.get_password_hash(doctor.password)
                user_updates.append("password = %s")
                user_params.append(hashed_password)
            
            if user_updates:
                user_params.append(user_id)
                cursor.execute(
                    f"UPDATE USERS SET {', '.join(user_updates)} WHERE user_id = %s",
                    user_params
                )
            
            # Update doctor-specific information
            doctor_updates = []
            doctor_params = []
            
            if doctor.specialty:
                # Get specialty ID from specialty name
                cursor.execute(
                    "SELECT spec_id FROM SPECIALIZATIONS WHERE spec_name = %s",
                    (doctor.specialty,)
                )
                spec_result = cursor.fetchone()
                if not spec_result:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Specialty '{doctor.specialty}' not found"
                    )
                doctor_updates.append("spec_id = %s")
                doctor_params.append(spec_result["spec_id"])
            
            if doctor.department_id:
                # Verify the department exists
                cursor.execute(
                    "SELECT department_id FROM DEPARTMENTS WHERE department_id = %s",
                    (doctor.department_id,)
                )
                dept_result = cursor.fetchone()
                if not dept_result:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Department with ID {doctor.department_id} not found"
                    )
                doctor_updates.append("department_id = %s")
                doctor_params.append(doctor.department_id)
            
            if doctor.years_of_experience is not None:
                doctor_updates.append("years_of_exp = %s")
                doctor_params.append(doctor.years_of_experience)
            
            if doctor_updates:
                doctor_params.append(doctor_id)
                cursor.execute(
                    f"UPDATE DOCTORS SET {', '.join(doctor_updates)} WHERE doctor_id = %s",
                    doctor_params
                )
            
            # Return the updated doctor information
            cursor.execute(
                """
                SELECT 
                    d.doctor_id, u.user_id, u.email, u.first_name, u.last_name,
                    u.phone, d.years_of_exp,
                    s.spec_id, s.spec_name,
                    dep.department_id, dep.department_name
                FROM DOCTORS d
                JOIN USERS u ON d.user_id = u.user_id
                JOIN SPECIALIZATIONS s ON d.spec_id = s.spec_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                WHERE d.doctor_id = %s
                """,
                (doctor_id,)
            )
            
            updated_doctor = cursor.fetchone()
            return updated_doctor

@router.delete("/{doctor_id}")
async def delete_doctor(doctor_id: int, current_user: Dict = Depends(get_current_admin)):
    """
    Delete a doctor and their associated user account.
    Only admin users can delete doctors.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if doctor exists and get user_id
            cursor.execute(
                "SELECT user_id FROM DOCTORS WHERE doctor_id = %s",
                (doctor_id,)
            )
            doctor = cursor.fetchone()
            if not doctor:
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )
            
            user_id = doctor["user_id"]
            
            # Check if doctor has any appointments
            cursor.execute(
                "SELECT COUNT(*) as appointment_count FROM APPOINTMENTS WHERE doctor_id = %s",
                (doctor_id,)
            )
            appointment_result = cursor.fetchone()
            if appointment_result and appointment_result["appointment_count"] > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete doctor with existing appointments. Please transfer or cancel appointments first."
                )
            
            # Delete doctor record first (foreign key constraint)
            cursor.execute(
                "DELETE FROM DOCTORS WHERE doctor_id = %s",
                (doctor_id,)
            )
            
            # Delete user record
            cursor.execute(
                "DELETE FROM USERS WHERE user_id = %s",
                (user_id,)
            )
            
            return {"message": "Doctor deleted successfully"}

@router.get("/{doctor_id}/patients/medications")
async def get_doctor_patients_medications(
    doctor_id: int,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get all medications for patients that have appointments with this doctor.
    Only the doctor themselves or an admin can access this endpoint.
    """
    # Check if user is the doctor or an admin
    is_authorized = False
    if current_user["role_name"] == "admin":
        is_authorized = True
    elif current_user["role_name"] == "doctor":
        # Check if current user is the doctor
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT user_id FROM DOCTORS
                    WHERE doctor_id = %s
                    """,
                    (doctor_id,)
                )
                doctor = cursor.fetchone()
                if doctor and doctor["user_id"] == current_user["user_id"]:
                    is_authorized = True
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view medications for this doctor's patients"
        )
    
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            # First, verify this doctor exists and current user has access
            cursor.execute(
                """
                SELECT d.doctor_id, u.user_id 
                FROM DOCTORS d
                JOIN USERS u ON d.user_id = u.user_id
                WHERE d.doctor_id = %s
                """,
                (doctor_id,)
            )
            doctor_check = cursor.fetchone()
            
            if not doctor_check:
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )
            
            # Additional security check: ensure current user matches the doctor
            if current_user["role_name"] == "doctor" and doctor_check["user_id"] != current_user["user_id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view medications for your own patients"
                )
            
            # Get medications ONLY for patients who have appointments with THIS specific doctor
            cursor.execute(
                """
                SELECT DISTINCT 
                    pm.medication_id,
                    pm.patient_id,
                    pm.medication_name,
                    pm.dosage,
                    u.first_name as patient_first_name,
                    u.last_name as patient_last_name,
                    u.email as patient_email,
                    p.date_of_birth,
                    p.gender,
                    p.blood_type,
                    MAX(a.appointment_date) as last_appointment,
                    a.status as appointment_status
                FROM PATIENT_MEDS pm
                JOIN PATIENTS p ON pm.patient_id = p.patient_id
                JOIN USERS u ON p.user_id = u.user_id
                JOIN APPOINTMENTS a ON p.patient_id = a.patient_id
                WHERE a.doctor_id = %s 
                  AND pm.patient_id IN (
                      SELECT DISTINCT patient_id 
                      FROM APPOINTMENTS 
                      WHERE doctor_id = %s
                  )
                GROUP BY pm.medication_id, pm.patient_id, pm.medication_name, pm.dosage,
                         u.first_name, u.last_name, u.email, p.date_of_birth, p.gender, p.blood_type, a.status
                ORDER BY u.last_name, u.first_name, pm.medication_name
                """,
                (doctor_id, doctor_id)
            )
            medications = cursor.fetchall()
            
            # Get doctor info for context
            cursor.execute(
                """
                SELECT d.doctor_id, u.first_name, u.last_name, 
                       u.email, s.spec_name, dep.department_name
                FROM DOCTORS d
                JOIN USERS u ON d.user_id = u.user_id
                JOIN SPECIALIZATIONS s ON d.spec_id = s.spec_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                WHERE d.doctor_id = %s
                """,
                (doctor_id,)
            )
            doctor_info = cursor.fetchone()
            
            if not doctor_info:
                raise HTTPException(
                    status_code=404,
                    detail="Doctor not found"
                )
    
    return {
        "doctor": doctor_info,
        "medications": medications,
        "total_medications": len(medications)
    }