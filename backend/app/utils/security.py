from datetime import datetime, timedelta
from typing import Optional, Dict, Union, Any
from jose import JWTError, jwt, ExpiredSignatureError
from passlib.context import CryptContext
import os
from fastapi import HTTPException, status
import secrets
import logging
from ..config.database import db
import re
import base64
import hashlib
from cryptography.fernet import Fernet
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class SecurityManager:
    def __init__(self):
        # Create a password context for hashing and verifying
        try:
            self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        except Exception as e:
            logger.error(f"Error initializing CryptContext: {str(e)}")
            # Fallback to a simpler hashing method
            class SimpleCryptContext:
                def verify(self, plain_password, hashed_password):
                    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
                    
                def hash(self, password):
                    return hashlib.sha256(password.encode()).hexdigest()
            
            self.pwd_context = SimpleCryptContext()

        self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

        # Initialize encryption key for sensitive data
        self.encryption_key = os.getenv("ENCRYPTION_KEY")
        if not self.encryption_key:
            self.encryption_key = base64.urlsafe_b64encode(
                hashlib.sha256(self.SECRET_KEY.encode()).digest()
            )
        self.fernet = Fernet(self.encryption_key)

        # Token blacklist cache
        self.token_blacklist = set()

    def create_access_token(self, data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, self.SECRET_KEY, algorithm="HS256")

    def verify_token(self, token: str) -> Dict:
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=["HS256"])
            return payload
        except JWTError:
            return None

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification error: {str(e)}")
            # Fallback to simple comparison if bcrypt fails
            return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

    def get_password_hash(self, password: str) -> str:
        try:
            return self.pwd_context.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {str(e)}")
            # Fallback to simple hash if bcrypt fails
            return hashlib.sha256(password.encode()).hexdigest()

    def _is_password_strong(self, password: str) -> bool:
        if len(password) < 8:
            return False
        if not re.search(r"[A-Z]", password):
            return False
        if not re.search(r"[a-z]", password):
            return False
        if not re.search(r"\d", password):
            return False
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False
        return True

    def encrypt_sensitive_data(self, data: Union[str, bytes]) -> str:
        if isinstance(data, str):
            data = data.encode()
        return self.fernet.encrypt(data).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        try:
            return self.fernet.decrypt(
                encrypted_data.encode()
            ).decode()
        except Exception as e:
            logger.error(f"Data decryption failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to decrypt data"
            )

    def check_permissions(self, user_id: int, required_permission: str) -> bool:
        try:
            with db.get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT p.permission_name 
                        FROM PERMISSIONS p
                        JOIN USER_PERMISSIONS up ON p.permission_id = up.permission_id
                        WHERE up.user_id = %s AND p.permission_name = %s
                        """,
                        (user_id, required_permission)
                    )
                    return bool(cursor.fetchone())
        except Exception as e:
            logger.error(f"Permission check failed: {str(e)}")
            return False

    def blacklist_token(self, token: str) -> None:
        try:
            payload = self.verify_token(token)
            self.token_blacklist.add(token)
            
            # Log token blacklisting
            with db.get_db() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO AUDIT_LOGS 
                        (event_type, user_identifier, details)
                        VALUES (%s, %s, %s)
                        """,
                        (
                            "TOKEN_BLACKLISTED",
                            payload.get("sub"),
                            json.dumps({"jti": payload.get("jti")})
                        )
                    )
                conn.commit()
                
        except Exception as e:
            logger.error(f"Token blacklisting failed: {str(e)}")

security = SecurityManager()

# Compatibility functions for tests
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return security.verify_password(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return security.get_password_hash(password)

def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    return security.create_access_token(data, expires_delta)

def verify_token(token: str) -> Dict:
    return security.verify_token(token) 