from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.config.database import db
from ..deps import get_current_user, get_current_doctor, get_current_admin
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
import logging
from datetime import datetime, timedelta

# Create schemas for timeslot operations
class TimeslotBase(BaseModel):
    calendar_id: int
    start_time: datetime
    end_time: datetime
    is_available: bool = True

class TimeslotCreate(TimeslotBase):
    pass

class TimeslotUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    is_available: Optional[bool] = None

class TimeslotInDB(TimeslotBase):
    slot_id: int

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", 
            response_model=List[Dict],
            summary="Get available timeslots",
            description="Retrieve all available timeslots, optionally filtered by doctor and date range")
async def get_available_timeslots(
    doctor_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    """
    Get available timeslots.
    
    Parameters:
    - doctor_id: Filter by specific doctor
    - date_from: Filter by start date (format: YYYY-MM-DD)
    - date_to: Filter by end date (format: YYYY-MM-DD)
    
    Returns a list of available timeslots with doctor information.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            query = """
                SELECT ts.slot_id, ts.calendar_id, ts.start_time, ts.end_time, ts.is_available, 
                       dc.doctor_id,
                       u.first_name as doctor_first_name,
                       u.last_name as doctor_last_name,
                       dep.department_id, dep.department_name
                FROM TIMESLOTS ts
                JOIN DOCTOR_CALENDAR dc ON ts.calendar_id = dc.calendar_id
                JOIN DOCTORS d ON dc.doctor_id = d.doctor_id
                JOIN USERS u ON d.user_id = u.user_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                WHERE ts.is_available = TRUE
            """
            params = []
            
            if doctor_id:
                query += " AND dc.doctor_id = %s"
                params.append(doctor_id)
            
            if date_from:
                query += " AND ts.start_time >= %s"
                params.append(date_from)
            
            if date_to:
                query += " AND ts.start_time <= %s"
                params.append(date_to)
            
            query += " ORDER BY ts.start_time"
            
            cursor.execute(query, params)
            return cursor.fetchall()

@router.get("/{slot_id}", 
            response_model=Dict,
            summary="Get timeslot details",
            description="Retrieve detailed information about a specific timeslot")
async def get_timeslot(slot_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get a specific timeslot by ID.
    
    Returns detailed information about the timeslot including doctor information.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT ts.slot_id, ts.calendar_id, ts.start_time, ts.end_time, ts.is_available, 
                       dc.doctor_id,
                       u.first_name as doctor_first_name,
                       u.last_name as doctor_last_name,
                       dep.department_id, dep.department_name
                FROM TIMESLOTS ts
                JOIN DOCTOR_CALENDAR dc ON ts.calendar_id = dc.calendar_id
                JOIN DOCTORS d ON dc.doctor_id = d.doctor_id
                JOIN USERS u ON d.user_id = u.user_id
                JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                WHERE ts.slot_id = %s
                """,
                (slot_id,)
            )
            slot = cursor.fetchone()
            
            if not slot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Time slot not found"
                )
    
    return slot

@router.post("/", 
             response_model=Dict,
             summary="Create new timeslot",
             description="Create a new timeslot for a doctor's calendar (doctor only)")
async def create_timeslot(
    data: TimeslotCreate = Body(..., 
        example={
            "calendar_id": 1,
            "start_time": "2023-12-01T09:00:00",
            "end_time": "2023-12-01T09:30:00",
            "is_available": True
        }
    ),
    current_user: Dict = Depends(get_current_doctor)
):
    """
    Create a new timeslot.
    
    Only doctors can create timeslots for their own calendars.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if calendar belongs to the current doctor
            cursor.execute(
                """
                SELECT dc.doctor_id, d.user_id
                FROM DOCTOR_CALENDAR dc
                JOIN DOCTORS d ON dc.doctor_id = d.doctor_id
                WHERE dc.calendar_id = %s
                """,
                (data.calendar_id,)
            )
            calendar = cursor.fetchone()
            
            if not calendar:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Calendar not found"
                )
            
            # Check if user is the doctor or an admin
            is_authorized = False
            if current_user["role_name"] == "admin":
                is_authorized = True
            elif current_user["role_name"] == "doctor" and calendar["user_id"] == current_user["user_id"]:
                is_authorized = True
            
            if not is_authorized:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to create timeslots for this calendar"
                )
            
            # Check if timeslot overlaps with existing timeslots
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
                    data.calendar_id,
                    data.start_time, data.start_time,
                    data.end_time, data.end_time,
                    data.start_time, data.end_time
                )
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Timeslot overlaps with existing timeslots"
                )
            
            # Create timeslot
            cursor.execute(
                """
                INSERT INTO TIMESLOTS (calendar_id, start_time, end_time, is_available)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    data.calendar_id,
                    data.start_time,
                    data.end_time,
                    data.is_available
                )
            )
            
            slot_id = cursor.lastrowid
    
    return {
        "slot_id": slot_id,
        "message": "Timeslot created successfully"
    }

@router.put("/{slot_id}", 
            response_model=Dict,
            summary="Update timeslot",
            description="Update an existing timeslot (doctor only)")
async def update_timeslot(
    slot_id: int,
    data: TimeslotUpdate = Body(..., 
        example={
            "start_time": "2023-12-01T10:00:00",
            "end_time": "2023-12-01T10:30:00",
            "is_available": False
        }
    ),
    current_user: Dict = Depends(get_current_doctor)
):
    """
    Update a timeslot.
    
    Only doctors can update their own timeslots.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Get the slot
            cursor.execute(
                """
                SELECT ts.*, dc.doctor_id, d.user_id
                FROM TIMESLOTS ts
                JOIN DOCTOR_CALENDAR dc ON ts.calendar_id = dc.calendar_id
                JOIN DOCTORS d ON dc.doctor_id = d.doctor_id
                WHERE ts.slot_id = %s
                """,
                (slot_id,)
            )
            slot = cursor.fetchone()
            
            if not slot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Time slot not found"
                )
            
            # Check if user is the doctor or an admin
            is_authorized = False
            if current_user["role_name"] == "admin":
                is_authorized = True
            elif current_user["role_name"] == "doctor" and slot["user_id"] == current_user["user_id"]:
                is_authorized = True
            
            if not is_authorized:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this time slot"
                )
            
            # Check if slot is used in any appointment if we're changing availability
            if data.is_available is not None and data.is_available != slot["is_available"] and not slot["is_available"]:
                cursor.execute(
                    """
                    SELECT COUNT(*) as appointment_count
                    FROM APPOINTMENTS
                    WHERE slot_id = %s
                    """,
                    (slot_id,)
                )
                result = cursor.fetchone()
                
                if result["appointment_count"] > 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Cannot change availability of a time slot with assigned appointments"
                    )
            
            # Update slot
            update_fields = []
            params = []
            
            if data.start_time is not None:
                update_fields.append("start_time = %s")
                params.append(data.start_time)
            
            if data.end_time is not None:
                update_fields.append("end_time = %s")
                params.append(data.end_time)
            
            if data.is_available is not None:
                update_fields.append("is_available = %s")
                params.append(data.is_available)
            
            if not update_fields:
                return {"message": "No changes to update"}
            
            # Add slot_id to params
            params.append(slot_id)
            
            cursor.execute(
                f"""
                UPDATE TIMESLOTS
                SET {", ".join(update_fields)}
                WHERE slot_id = %s
                """,
                params
            )
    
    return {"message": "Time slot updated successfully"}

@router.delete("/{slot_id}", 
               response_model=Dict,
               summary="Delete timeslot",
               description="Delete an existing timeslot (doctor only)")
async def delete_timeslot(
    slot_id: int,
    current_user: Dict = Depends(get_current_doctor)
):
    """
    Delete a timeslot.
    
    Only doctors can delete their own timeslots.
    Timeslots with assigned appointments cannot be deleted.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Get the slot
            cursor.execute(
                """
                SELECT ts.*, dc.doctor_id, d.user_id
                FROM TIMESLOTS ts
                JOIN DOCTOR_CALENDAR dc ON ts.calendar_id = dc.calendar_id
                JOIN DOCTORS d ON dc.doctor_id = d.doctor_id
                WHERE ts.slot_id = %s
                """,
                (slot_id,)
            )
            slot = cursor.fetchone()
            
            if not slot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Time slot not found"
                )
            
            # Check if user is the doctor or an admin
            is_authorized = False
            if current_user["role_name"] == "admin":
                is_authorized = True
            elif current_user["role_name"] == "doctor" and slot["user_id"] == current_user["user_id"]:
                is_authorized = True
            
            if not is_authorized:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this time slot"
                )
            
            # Check if slot is used in any appointment
            cursor.execute(
                """
                SELECT COUNT(*) as appointment_count
                FROM APPOINTMENTS
                WHERE slot_id = %s
                """,
                (slot_id,)
            )
            result = cursor.fetchone()
            
            if result["appointment_count"] > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete time slot with assigned appointments"
                )
            
            # Delete slot
            cursor.execute(
                """
                DELETE FROM TIMESLOTS
                WHERE slot_id = %s
                """,
                (slot_id,)
            )
    
    return {"message": "Time slot deleted successfully"}

@router.post("/bulk", 
             response_model=Dict,
             summary="Create multiple timeslots",
             description="Create multiple timeslots at once for a doctor's calendar (doctor only)")
async def create_bulk_timeslots(
    data: Dict = Body(..., 
        example={
            "calendar_id": 1,
            "start_date": "2023-12-01",
            "end_date": "2023-12-07",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "weekdays": [1, 2, 3, 4, 5],  # Monday to Friday
            "exclude_dates": ["2023-12-03"]  # Exclude specific dates
        }
    ),
    current_user: Dict = Depends(get_current_doctor)
):
    """
    Create multiple timeslots at once.
    
    This endpoint allows doctors to create a schedule of timeslots for a date range.
    
    Parameters:
    - calendar_id: The doctor's calendar ID
    - start_date: The first date to create slots for (YYYY-MM-DD)
    - end_date: The last date to create slots for (YYYY-MM-DD)
    - start_time: The start time for each day (HH:MM:SS)
    - end_time: The end time for each day (HH:MM:SS)
    - slot_duration_minutes: Duration of each slot in minutes
    - weekdays: List of weekdays to create slots for (0=Sunday, 1=Monday, ..., 6=Saturday)
    - exclude_dates: List of specific dates to exclude (YYYY-MM-DD)
    """
    calendar_id = data.get("calendar_id")
    start_date = datetime.strptime(data.get("start_date"), "%Y-%m-%d").date()
    end_date = datetime.strptime(data.get("end_date"), "%Y-%m-%d").date()
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    slot_duration = timedelta(minutes=data.get("slot_duration_minutes", 30))
    weekdays = data.get("weekdays", [0, 1, 2, 3, 4, 5, 6])  # Default to all days
    exclude_dates = [datetime.strptime(d, "%Y-%m-%d").date() for d in data.get("exclude_dates", [])]
    
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Check if calendar belongs to the current doctor
            cursor.execute(
                """
                SELECT dc.doctor_id, d.user_id
                FROM DOCTOR_CALENDAR dc
                JOIN DOCTORS d ON dc.doctor_id = d.doctor_id
                WHERE dc.calendar_id = %s
                """,
                (calendar_id,)
            )
            calendar = cursor.fetchone()
            
            if not calendar:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Calendar not found"
                )
            
            # Check if user is the doctor or an admin
            is_authorized = False
            if current_user["role_name"] == "admin":
                is_authorized = True
            elif current_user["role_name"] == "doctor" and calendar["user_id"] == current_user["user_id"]:
                is_authorized = True
            
            if not is_authorized:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to create timeslots for this calendar"
                )
            
            # Create timeslots
            created_count = 0
            current_date = start_date
            while current_date <= end_date:
                # Skip if not in selected weekdays or in excluded dates
                if current_date.weekday() not in weekdays or current_date in exclude_dates:
                    current_date += timedelta(days=1)
                    continue
                
                # Create slots for this day
                day_start = datetime.combine(current_date, datetime.strptime(start_time, "%H:%M:%S").time())
                day_end = datetime.combine(current_date, datetime.strptime(end_time, "%H:%M:%S").time())
                
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
                    
                    slot_start = slot_end
                
                current_date += timedelta(days=1)
    
    return {
        "message": f"Successfully created {created_count} timeslots",
        "created_count": created_count
    } 