from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from ...config.database import db
from ..deps import get_current_user, verify_permission
from ...utils.security import security
from typing import Dict, List, Optional
import logging
from datetime import datetime
from fastapi.websockets import WebSocket, WebSocketDisconnect
from asyncio import Queue
import asyncio

router = APIRouter()
logger = logging.getLogger(__name__)

class NotificationManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.message_queues: Dict[int, Queue] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
            self.message_queues[user_id] = Queue()
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        self.active_connections[user_id].remove(websocket)
        if not self.active_connections[user_id]:
            del self.active_connections[user_id]
            del self.message_queues[user_id]

    async def send_notification(self, user_id: int, message: Dict):
        if user_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            
            for dead_connection in dead_connections:
                self.active_connections[user_id].remove(dead_connection)

notification_manager = NotificationManager()

@router.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str
):
    try:
        payload = security.verify_token(token)
        if str(user_id) != str(payload.get("sub")):
            await websocket.close(code=4003)
            return
            
        await notification_manager.connect(websocket, user_id)
        
        try:
            while True:
                await websocket.receive_text()
                
        except WebSocketDisconnect:
            notification_manager.disconnect(websocket, user_id)
            
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close(code=4000)

@router.post("/")
async def create_notification(
    data: Dict,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    try:
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO NOTIFICATIONS (
                        user_id, notification_type, content,
                        sent_status, delivery_time
                    ) VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        data["user_id"],
                        data["notification_type"],
                        data["content"],
                        False,  # sent_status initially false
                        datetime.now()  # delivery_time set to now
                    )
                )
                
                notification_id = cursor.lastrowid
                
                background_tasks.add_task(
                    notification_manager.send_notification,
                    data["user_id"],
                    {
                        "type": "notification",
                        "data": {
                            "id": notification_id,
                            "content": data["content"],
                            "type": data["notification_type"]
                        }
                    }
                )

        return {"notif_id": notification_id, "message": "Notification created successfully"}

    except Exception as e:
        logger.error(f"Notification creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )

@router.get("/")
async def get_notifications(
    current_user: Dict = Depends(get_current_user),
    unread_only: bool = False,
    limit: int = 50
):
    with db.get_db() as conn:
        with conn.cursor() as cursor:
            query = """
                SELECT *
                FROM NOTIFICATIONS
                WHERE user_id = %s
            """
            params = [current_user["user_id"]]
            
            if unread_only:
                query += " AND sent_status = FALSE"
            
            query += " ORDER BY delivery_time DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            notifications = cursor.fetchall()
    
    return notifications

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: Dict = Depends(get_current_user)
):
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify notification exists and belongs to user
            cursor.execute(
                """
                SELECT * FROM NOTIFICATIONS
                WHERE notif_id = %s AND user_id = %s
                """,
                (notification_id, current_user["user_id"])
            )
            notification = cursor.fetchone()
            
            if not notification:
                raise HTTPException(
                    status_code=404,
                    detail="Notification not found"
                )
            
            cursor.execute(
                """
                UPDATE NOTIFICATIONS
                SET sent_status = TRUE
                WHERE notif_id = %s
                """,
                (notification_id,)
            )
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: Dict = Depends(get_current_user)
):
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE NOTIFICATIONS
                SET sent_status = TRUE
                WHERE user_id = %s AND sent_status = FALSE
                """,
                (current_user["user_id"],)
            )
            
            updated_count = cursor.rowcount
    
    return {"message": f"{updated_count} notifications marked as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: Dict = Depends(get_current_user)
):
    with db.transaction() as conn:
        with conn.cursor() as cursor:
            # Verify notification exists and belongs to user
            cursor.execute(
                """
                SELECT * FROM NOTIFICATIONS
                WHERE notif_id = %s AND user_id = %s
                """,
                (notification_id, current_user["user_id"])
            )
            notification = cursor.fetchone()
            
            if not notification:
                raise HTTPException(
                    status_code=404,
                    detail="Notification not found"
                )
            
            cursor.execute(
                """
                DELETE FROM NOTIFICATIONS
                WHERE notif_id = %s
                """,
                (notification_id,)
            )
    
    return {"message": "Notification deleted successfully"}