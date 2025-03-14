from fastapi import APIRouter, Depends, HTTPException, status
from ...config.database import db
from ..deps import get_current_user, get_current_patient
from typing import Dict, List
import logging
from pydantic import BaseModel, Field
from app.services.chatbot import chatbot_service

router = APIRouter()
logger = logging.getLogger(__name__)

class ChatbotQuery(BaseModel):
    query: str = Field(..., example="I have a headache", description="User's question or message to the chatbot")

class ChatbotResponse(BaseModel):
    response: str = Field(..., example="Headaches can be caused by various factors...", description="Chatbot's response")
    timestamp: str = Field(..., example="2023-06-15T10:30:00", description="When the response was generated")

class ChatHistory(BaseModel):
    id: int = Field(..., example=1, description="Unique identifier for the chat entry")
    query: str = Field(..., example="I have a headache", description="User's question or message")
    response: str = Field(..., example="Headaches can be caused by various factors...", description="Chatbot's response")
    timestamp: str = Field(None, example="2023-06-15T10:30:00", description="When the conversation occurred")
    doctor_id: int = Field(None, example=5, description="ID of the recommended doctor, if any")

@router.post("", response_model=ChatbotResponse,
            summary="Query the chatbot",
            description="Send a query to the chatbot and get a response.")
async def query_chatbot(
    query: ChatbotQuery, 
    current_user = Depends(get_current_user)
):
    """
    Send a query to the chatbot and get a response.
    
    - **query**: The user's question or message
    
    Returns the chatbot's response and timestamp.
    """
    # Process the query
    response = chatbot_service.process_query(query.query, current_user["user_id"])
    
    # Return the response
    return response

@router.get("/history", response_model=List[ChatHistory],
           summary="Get chatbot history",
           description="Get the chatbot conversation history for the current user.")
async def get_chatbot_history(
    current_user = Depends(get_current_user)
):
    """
    Get the chatbot conversation history for the current user.
    
    Returns a list of previous conversations with the chatbot.
    """
    # Get the history
    history = chatbot_service.get_history(current_user["user_id"])
    
    # Return the history
    return history

@router.post("/chatbot/query")
async def chatbot_query(data: Dict, current_user: Dict = Depends(get_current_patient)):
    try:
        # Get patient_id
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
                
                if not patient:
                    raise HTTPException(
                        status_code=404,
                        detail="Patient record not found"
                    )
                
                patient_id = patient["patient_id"]
        
        # Process the symptoms
        symptoms = data.get("symptoms", "")
        
        # Here you would typically call an AI service to analyze symptoms
        # For now, we'll just log the symptoms and recommend seeing a doctor
        
        # Find a suitable doctor based on symptoms (simplified logic)
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                # Log the chatbot interaction
                cursor.execute(
                    """
                    INSERT INTO CHATBOT_LOGS (
                        patient_id, symptoms
                    ) VALUES (%s, %s)
                    """,
                    (patient_id, symptoms)
                )
                log_id = cursor.lastrowid
                
                # Find a doctor (simplified - just get any doctor)
                cursor.execute(
                    """
                    SELECT d.doctor_id, u.first_name, u.last_name,
                           s.spec_name, dep.department_name
                    FROM DOCTORS d
                    JOIN USERS u ON d.user_id = u.user_id
                    JOIN SPECIALIZATIONS s ON d.spec_id = s.spec_id
                    JOIN DEPARTMENTS dep ON d.department_id = dep.department_id
                    LIMIT 1
                    """
                )
                doctor = cursor.fetchone()
                
                if doctor:
                    # Update the log with the recommended doctor
                    cursor.execute(
                        """
                        UPDATE CHATBOT_LOGS
                        SET doctor_id = %s
                        WHERE log_id = %s
                        """,
                        (doctor["doctor_id"], log_id)
                    )
        
        response = {
            "message": "Based on your symptoms, I recommend seeing a doctor.",
            "severity": "medium",
            "recommended_action": "Schedule an appointment"
        }
        
        if doctor:
            response["recommended_doctor"] = {
                "doctor_id": doctor["doctor_id"],
                "name": f"Dr. {doctor['first_name']} {doctor['last_name']}",
                "specialization": doctor["spec_name"],
                "department": doctor["department_name"]
            }
        
        return response
    
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your request"
        )

@router.get("/chatbot/history")
async def get_chatbot_history(current_user: Dict = Depends(get_current_patient)):
    try:
        # Get patient_id
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
                
                if not patient:
                    raise HTTPException(
                        status_code=404,
                        detail="Patient record not found"
                    )
                
                patient_id = patient["patient_id"]
                
                # Get chatbot history
                cursor.execute(
                    """
                    SELECT cl.*, 
                           u.first_name as doctor_first_name,
                           u.last_name as doctor_last_name
                    FROM CHATBOT_LOGS cl
                    LEFT JOIN DOCTORS d ON cl.doctor_id = d.doctor_id
                    LEFT JOIN USERS u ON d.user_id = u.user_id
                    WHERE cl.patient_id = %s
                    ORDER BY cl.timestamp DESC
                    """,
                    (patient_id,)
                )
                history = cursor.fetchall()
        
        return history
    
    except Exception as e:
        logger.error(f"Chatbot history error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving your chatbot history"
        ) 