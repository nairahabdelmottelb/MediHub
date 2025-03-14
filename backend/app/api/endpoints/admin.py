from fastapi import APIRouter, Depends, HTTPException, status
from ...config.database import db
from ..deps import get_current_user, verify_permission
from typing import Dict, List
import logging
from datetime import datetime
import json

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/departments")
async def create_department(
    data: Dict,
    current_user: Dict = Depends(get_current_user)
):
    await verify_permission("manage_departments", current_user)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO DEPARTMENTS (
                        department_name, description, 
                        created_by, created_at
                    ) VALUES (%s, %s, %s, NOW())
                    """,
                    (
                        data["department_name"],
                        data.get("description"),
                        current_user["user_id"]
                    )
                )
                
                department_id = cursor.lastrowid
                
                cursor.execute(
                    """
                    INSERT INTO AUDIT_LOGS (
                        event_type, user_identifier,
                        details, reference_id, reference_type
                    ) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        "DEPARTMENT_CREATED",
                        current_user["user_id"],
                        json.dumps({"department_name": data["department_name"]}),
                        department_id,
                        "DEPARTMENTS"
                    )
                )
                
        return {"department_id": department_id}
        
    except Exception as e:
        logger.error(f"Department creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create department"
        )

@router.post("/specializations")
async def create_specialization(
    data: Dict,
    current_user: Dict = Depends(get_current_user)
):
    await verify_permission("manage_specializations", current_user)
    try:
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO SPECIALIZATIONS (
                        spec_name, description,
                        created_by, created_at
                    ) VALUES (%s, %s, %s, NOW())
                    """,
                    (
                        data["spec_name"],
                        data.get("description"),
                        current_user["user_id"]
                    )
                )
                
                spec_id = cursor.lastrowid
                
                cursor.execute(
                    """
                    INSERT INTO AUDIT_LOGS (
                        event_type, user_identifier,
                        details, reference_id, reference_type
                    ) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        "SPECIALIZATION_CREATED",
                        current_user["user_id"],
                        json.dumps({"spec_name": data["spec_name"]}),
                        spec_id,
                        "SPECIALIZATIONS"
                    )
                )
                
        return {"spec_id": spec_id}
        
    except Exception as e:
        logger.error(f"Specialization creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create specialization"
        )

@router.get("/audit-logs")
async def get_audit_logs(
    current_user: Dict = Depends(get_current_user),
    event_type: str = None,
    start_date: str = None,
    end_date: str = None,
    user_id: int = None,
    limit: int = 100
) -> List[Dict]:
    await verify_permission("view_audit_logs", current_user)
    try:
        with db.get_db() as conn:
            with conn.cursor() as cursor:
                query = """
                    SELECT al.*,
                           u.first_name,
                           u.last_name,
                           u.email
                    FROM AUDIT_LOGS al
                    LEFT JOIN USERS u ON al.user_identifier = u.user_id
                    WHERE 1=1
                """
                params = []
                
                if event_type:
                    query += " AND al.event_type = %s"
                    params.append(event_type)
                
                if start_date:
                    query += " AND al.created_at >= %s"
                    params.append(start_date)
                
                if end_date:
                    query += " AND al.created_at <= %s"
                    params.append(end_date)
                
                if user_id:
                    query += " AND al.user_identifier = %s"
                    params.append(user_id)
                
                query += " ORDER BY al.created_at DESC LIMIT %s"
                params.append(limit)
                
                cursor.execute(query, params)
                logs = cursor.fetchall()
                
                for log in logs:
                    if log["details"]:
                        log["details"] = json.loads(log["details"])
                
                return logs
                
    except Exception as e:
        logger.error(f"Audit logs retrieval failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit logs"
        ) 