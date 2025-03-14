from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime
import logging
from ..deps import get_current_user
from ...config.database import db
import json

# Initialize router
router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic models
class MessageCreate(BaseModel):
    receiver_id: int
    message: str
    is_urgent: bool = False
    message_type: str = "Text"

class MessageResponse(BaseModel):
    message_id: int
    sender_id: int
    receiver_id: int
    message: str
    sent_at: datetime
    is_urgent: bool
    read_status: bool
    message_type: str

class ContactResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    unread_count: int
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None

# Add this helper function to handle datetime serialization
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Add this helper function to convert database rows to JSON-serializable dicts
def serialize_db_row(row):
    if not row:
        return None
    result = dict(row)
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
    return result

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected to WebSocket. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected from WebSocket. Remaining users: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    # Serialize the message with our custom encoder
                    serialized_message = json.loads(json.dumps(message, cls=DateTimeEncoder))
                    await connection.send_json(serialized_message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {str(e)}")

# Create connection manager instance
manager = ConnectionManager()

@router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(current_user: Dict = Depends(get_current_user)):
    """
    Get a list of users the current user has chatted with or can chat with.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            # Get all users except current user
            cursor.execute(
                """
                SELECT u.user_id, u.first_name, u.last_name, u.email
                FROM users u
                WHERE u.user_id != %s
                ORDER BY u.first_name, u.last_name
                """,
                (current_user["user_id"],)
            )
            contacts = cursor.fetchall()
            
            # For each contact, get unread count and last message
            for contact in contacts:
                # Get unread count
                cursor.execute(
                    """
                    SELECT COUNT(*) as unread_count
                    FROM chat_messages
                    WHERE sender_id = %s AND receiver_id = %s AND read_status = FALSE
                    """,
                    (contact["user_id"], current_user["user_id"])
                )
                unread_result = cursor.fetchone()
                contact["unread_count"] = unread_result["unread_count"] if unread_result else 0
                
                # Get last message
                cursor.execute(
                    """
                    SELECT message, sent_at
                    FROM chat_messages
                    WHERE (sender_id = %s AND receiver_id = %s)
                       OR (sender_id = %s AND receiver_id = %s)
                    ORDER BY sent_at DESC
                    LIMIT 1
                    """,
                    (current_user["user_id"], contact["user_id"], 
                     contact["user_id"], current_user["user_id"])
                )
                last_message = cursor.fetchone()
                if last_message:
                    contact["last_message"] = last_message["message"]
                    contact["last_message_time"] = last_message["sent_at"]
    
    return contacts

@router.get("/messages", response_model=List[MessageResponse])
async def get_messages(contact_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Get all messages between the current user and a specific contact.
    """
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT message_id, sender_id, receiver_id, message, message_type,
                       sent_at, read_status, is_urgent
                FROM chat_messages
                WHERE (sender_id = %s AND receiver_id = %s)
                   OR (sender_id = %s AND receiver_id = %s)
                ORDER BY sent_at ASC
                """,
                (current_user["user_id"], contact_id, contact_id, current_user["user_id"])
            )
            messages = cursor.fetchall()
            
            # Mark messages from contact as read
            cursor.execute(
                """
                UPDATE chat_messages
                SET read_status = TRUE
                WHERE sender_id = %s AND receiver_id = %s AND read_status = FALSE
                """,
                (contact_id, current_user["user_id"])
            )
    
    return messages

@router.post("/send", response_model=MessageResponse)
async def send_message(message: MessageCreate, current_user: Dict = Depends(get_current_user)):
    """
    Send a new message to another user.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify receiver exists
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = %s",
                (message.receiver_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Recipient not found")
            
            now = datetime.now()
            
            # Insert the message
            cursor.execute(
                """
                INSERT INTO chat_messages (
                    sender_id, receiver_id, message, sent_at,
                    is_urgent, read_status, message_type
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    current_user["user_id"],
                    message.receiver_id,
                    message.message,
                    now,
                    message.is_urgent,
                    False,
                    message.message_type
                )
            )
            
            # Get the message ID
            message_id = cursor.lastrowid
            
            # Fetch the complete message data
            cursor.execute(
                """
                SELECT message_id, sender_id, receiver_id, message, message_type,
                       sent_at, read_status, is_urgent
                FROM chat_messages
                WHERE message_id = %s
                """,
                (message_id,)
            )
            
            new_message_row = cursor.fetchone()
            new_message = serialize_db_row(new_message_row)
            
            # Send message via WebSocket if recipient is connected
            if message.receiver_id in manager.active_connections:
                await manager.send_personal_message(
                    {
                        "type": "chat_message",
                        "data": new_message
                    },
                    message.receiver_id
                )
                logger.info(f"Message sent to recipient {message.receiver_id} via WebSocket")
    
    return new_message

@router.put("/messages/{message_id}/read", response_model=Dict)
async def mark_message_read(message_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Mark a message as read.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify message exists and is sent to current user
            cursor.execute(
                """
                SELECT message_id
                FROM chat_messages
                WHERE message_id = %s AND receiver_id = %s
                """,
                (message_id, current_user["user_id"])
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Message not found or you don't have permission to mark it as read"
                )
            
            # Mark as read
            cursor.execute(
                """
                UPDATE chat_messages
                SET read_status = TRUE
                WHERE message_id = %s
                """,
                (message_id,)
            )
    
    return {"status": "success"}

@router.put("/messages/read-all", response_model=Dict)
async def mark_all_messages_read(sender_id: int, current_user: Dict = Depends(get_current_user)):
    """
    Mark all messages from a specific sender as read.
    """
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE chat_messages
                SET read_status = TRUE
                WHERE sender_id = %s AND receiver_id = %s AND read_status = FALSE
                """,
                (sender_id, current_user["user_id"])
            )
    
    return {"status": "success"}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, token: str):
    """
    WebSocket endpoint for real-time messaging.
    """
    try:
        # Verify token
        from ..deps import security
        payload = security.verify_token(token)
        token_user_id = payload.get("sub")
        
        # Ensure the user is connecting to their own websocket
        if str(token_user_id) != str(user_id):
            await websocket.close(code=4003, reason="Unauthorized")
            return
        
        # Connect to websocket
        await manager.connect(websocket, user_id)
        logger.info(f"User {user_id} connected to WebSocket")
        
        try:
            while True:
                # Wait for messages from client
                data = await websocket.receive_json()
                logger.debug(f"Received WebSocket message from user {user_id}: {data}")
                
                # Handle different message types
                message_type = data.get("type")
                
                if message_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue
                
                elif message_type == "chat_message":
                    # Verify required fields
                    if not all(key in data for key in ["receiver_id", "message"]):
                        await websocket.send_json({
                            "type": "error",
                            "message": "Invalid message format"
                        })
                        continue
                    
                    try:
                        # Insert message into database
                        with db.transaction() as conn:
                            with conn.cursor() as cursor:
                                now = datetime.now()
                                cursor.execute(
                                    """
                                    INSERT INTO chat_messages (
                                        sender_id, receiver_id, message, sent_at,
                                        is_urgent, read_status, message_type
                                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                                    """,
                                    (
                                        user_id,
                                        data["receiver_id"],
                                        data["message"],
                                        now,
                                        data.get("is_urgent", False),
                                        False,
                                        data.get("message_type", "Text")
                                    )
                                )
                                message_id = cursor.lastrowid
                                
                                # Fetch the complete message
                                cursor.execute(
                                    """
                                    SELECT message_id, sender_id, receiver_id, message, message_type,
                                           sent_at, read_status, is_urgent
                                    FROM chat_messages
                                    WHERE message_id = %s
                                    """,
                                    (message_id,)
                                )
                                new_message_row = cursor.fetchone()
                                # Convert to a serializable dict
                                new_message = serialize_db_row(new_message_row)
                        
                        # Prepare message data for WebSocket
                        message_data = {
                            "type": "chat_message",
                            "data": new_message
                        }
                        
                        # Send to receiver if they're connected
                        receiver_id = int(data["receiver_id"])
                        if receiver_id in manager.active_connections:
                            await manager.send_personal_message(
                                message_data,
                                receiver_id
                            )
                            logger.info(f"Message sent to receiver {receiver_id}")
                        else:
                            logger.info(f"Receiver {receiver_id} not connected, message saved to database only")
                        
                        # Send confirmation back to sender
                        await websocket.send_json(message_data)
                        
                        logger.info(f"Message sent from {user_id} to {data['receiver_id']}")
                    
                    except Exception as e:
                        logger.error(f"Error processing message: {str(e)}")
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Error processing message: {str(e)}"
                        })
                
        except WebSocketDisconnect:
            logger.info(f"User {user_id} disconnected from WebSocket")
            manager.disconnect(websocket, user_id)
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=4000)
