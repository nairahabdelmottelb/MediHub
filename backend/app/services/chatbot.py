import logging
from typing import Dict, List, Optional
from ..config.database import db
from datetime import datetime
import json
import os
import requests

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        # You could initialize any AI models or external services here
    
    def process_query(self, query: str, user_id: int) -> Dict:
        """
        Process a user query and generate a response.
        
        Args:
            query: The user's question or message
            user_id: The ID of the user making the query
            
        Returns:
            A dictionary containing the chatbot's response
        """
        try:
            # Log the query
            self._log_query(user_id, query)
            
            # For now, we'll use a simple rule-based response
            # In a real implementation, this would call an AI model or external service
            response = self._generate_simple_response(query)
            
            # Log the response
            self._log_response(user_id, response)
            
            return {
                "response": response,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error processing chatbot query: {str(e)}")
            return {
                "response": "I'm sorry, I encountered an error processing your request.",
                "timestamp": datetime.now().isoformat()
            }
    
    def get_history(self, user_id: int) -> List[Dict]:
        """
        Get the conversation history for a user.
        
        Args:
            user_id: The ID of the user
            
        Returns:
            A list of chat history entries
        """
        try:
            with db.get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT * FROM CHATBOT_LOGS
                        WHERE user_id = %s
                        ORDER BY timestamp DESC
                        LIMIT 50
                        """,
                        (user_id,)
                    )
                    logs = cursor.fetchall()
                    
                    # Convert to a more user-friendly format
                    history = []
                    for log in logs:
                        history.append({
                            "id": log["log_id"],
                            "query": log["symptoms"],  # Using symptoms field for query
                            "response": log.get("response", ""),
                            "timestamp": log["timestamp"].isoformat() if log["timestamp"] else None,
                            "doctor_id": log.get("doctor_id")
                        })
                    
                    return history
                    
        except Exception as e:
            self.logger.error(f"Error retrieving chatbot history: {str(e)}")
            return []
    
    def _log_query(self, user_id: int, query: str) -> int:
        """
        Log a user query to the database.
        
        Args:
            user_id: The ID of the user
            query: The user's question or message
            
        Returns:
            The ID of the created log entry
        """
        try:
            # Get patient_id from user_id
            patient_id = None
            with db.get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT patient_id FROM PATIENTS
                        WHERE user_id = %s
                        """,
                        (user_id,)
                    )
                    patient = cursor.fetchone()
                    if patient:
                        patient_id = patient["patient_id"]
            
            # If no patient record, use user_id directly
            with db.transaction() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO CHATBOT_LOGS (
                            patient_id, user_id, symptoms, timestamp
                        ) VALUES (%s, %s, %s, %s)
                        """,
                        (
                            patient_id,
                            user_id,
                            query,
                            datetime.now()
                        )
                    )
                    return cursor.lastrowid
                    
        except Exception as e:
            self.logger.error(f"Error logging chatbot query: {str(e)}")
            return None
    
    def _log_response(self, user_id: int, response: str) -> bool:
        """
        Log a chatbot response to the database.
        
        Args:
            user_id: The ID of the user
            response: The chatbot's response
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with db.transaction() as conn:
                with conn.cursor() as cursor:
                    # Get the most recent log for this user
                    cursor.execute(
                        """
                        SELECT log_id FROM CHATBOT_LOGS
                        WHERE user_id = %s
                        ORDER BY timestamp DESC
                        LIMIT 1
                        """,
                        (user_id,)
                    )
                    log = cursor.fetchone()
                    
                    if log:
                        # Update the log with the response
                        cursor.execute(
                            """
                            UPDATE CHATBOT_LOGS
                            SET response = %s
                            WHERE log_id = %s
                            """,
                            (response, log["log_id"])
                        )
                        return True
                    
            return False
                    
        except Exception as e:
            self.logger.error(f"Error logging chatbot response: {str(e)}")
            return False
    
    def _generate_simple_response(self, query: str) -> str:
        """
        Generate a simple rule-based response.
        
        Args:
            query: The user's question or message
            
        Returns:
            A string response
        """
        query = query.lower()
        
        # Simple keyword matching
        if "hello" in query or "hi" in query or "hey" in query:
            return "Hello! How can I help you with your health today?"
        
        elif "appointment" in query or "schedule" in query or "book" in query:
            return "To schedule an appointment, please go to the Appointments section or call our office."
        
        elif "headache" in query or "head pain" in query:
            return "Headaches can be caused by various factors including stress, dehydration, or lack of sleep. If it's severe or persistent, please consult with a doctor."
        
        elif "fever" in query or "temperature" in query:
            return "A fever might indicate an infection. Rest, stay hydrated, and take over-the-counter fever reducers. If it persists over 3 days or exceeds 103°F (39.4°C), please seek medical attention."
        
        elif "cold" in query or "flu" in query or "cough" in query:
            return "For cold and flu symptoms, rest, stay hydrated, and consider over-the-counter medications for symptom relief. If symptoms worsen or persist, please consult with a doctor."
        
        elif "pain" in query:
            return "Pain can have many causes. Could you describe where the pain is located and its severity? This will help me provide better guidance."
        
        elif "thank" in query:
            return "You're welcome! Is there anything else I can help you with?"
        
        else:
            return "I'm not sure I understand your question. Could you please rephrase or provide more details about your health concern?"

# Create a singleton instance
chatbot_service = ChatbotService() 