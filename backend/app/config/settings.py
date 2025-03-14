import os
from typing import List, Optional, Union
from pydantic import BaseModel, validator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    # API settings
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "MediHub")
    PROJECT_DESCRIPTION: str = os.getenv("PROJECT_DESCRIPTION", "Healthcare Management System API")
    PROJECT_VERSION: str = os.getenv("PROJECT_VERSION", "1.0.0")
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-development-only")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Database settings
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
    DB_NAME: str = os.getenv("DB_NAME", "medihub")
    
    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000,http://localhost:8000").split(",")
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Email settings
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() in ("true", "1", "t", "yes")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "info@medihub.com")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "MediHub Support")
    
    # File storage settings
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_CONTENT_LENGTH", str(16 * 1024 * 1024)))  # 16 MB
    
    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Debug mode
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t", "yes")

# Create settings instance
settings = Settings()

# Example .env file content to include in your project:
"""
# API Settings
API_V1_STR=/api/v1
PROJECT_NAME=MediHub
PROJECT_DESCRIPTION=Healthcare Management System API
PROJECT_VERSION=1.0.0

# Security Settings
SECRET_KEY=your-production-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database Settings
DB_HOST=localhost
DB_PORT=3306
DB_USER=medihub_user
DB_PASSWORD=secure_password
DB_NAME=medihub

# CORS Settings
CORS_ORIGINS=http://localhost,http://localhost:3000,https://yourdomain.com

# Email Settings
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAILS_FROM_EMAIL=support@medihub.com
EMAILS_FROM_NAME=MediHub Support

# File Storage Settings
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# Logging Settings
LOG_LEVEL=INFO

# Debug Mode
DEBUG=False
"""
