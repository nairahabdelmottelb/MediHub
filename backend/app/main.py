from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.models import OAuthFlows, OAuthFlowPassword
from fastapi.openapi.utils import get_openapi
from app.api.api import api_router
from app.config.settings import settings
import logging
import uuid
from datetime import datetime
import traceback
import os
from pathlib import Path
from app.api.endpoints import auth, chat, users  # Make sure users is imported
from app.utils.db_init import initialize_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("app.main")

app = FastAPI(
    title="MediHub API",
    description="""
    Backend API for the MediHub healthcare application
    
    ## Authentication
    
    Multiple login options are available:
    
    1. Standard login at `/api/auth/login`:
       - Using Swagger UI: Enter your email in the 'username' field
       - Using form data: Send email/password or username/password
       - Using JSON: Send {"email": "user@example.com", "password": "yourpassword"} 
                     or {"username": "user@example.com", "password": "yourpassword"}
    
    2. JSON-only login at `/api/auth/login/json`:
       - Simple endpoint for direct JSON: {"email": "user@example.com", "password": "yourpassword"}
       - Also accepts: {"username": "user@example.com", "password": "yourpassword"}
       
    3. NEW: Simplified JSON login at `/api/auth/json-login`:
       - Clean JSON-only interface
       - Returns more user information in response
       - Example: {"email": "user@example.com", "password": "yourpassword"}
    """,
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware with more permissive settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Create a "static" directory if it doesn't exist
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)

# Copy test.html to the static directory
test_html_path = Path("test.html")
if test_html_path.exists():
    with open(test_html_path, "r") as src_file:
        content = src_file.read()
        with open(static_dir / "test.html", "w") as dest_file:
            dest_file.write(content)
    logger.info(f"Copied test.html to {static_dir / 'test.html'}")
else:
    logger.warning("test.html not found in current directory")

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API router
app.include_router(api_router, prefix="/api")

# Include routers
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])  # Removed to avoid duplication
# app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])  # Removed to avoid duplication
# app.include_router(users.router, prefix="/api/v1/users", tags=["users"])  # Removed to avoid duplication

# Custom OAuth2 scheme for Swagger UI
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False
)

# Custom OpenAPI schema to use JSON login
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Customize the security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "/api/auth/login",
                    "scopes": {}
                }
            },
            "description": "Login using email and password. In the Swagger UI form, enter your email in the 'username' field. When using direct JSON, either 'email' or 'username' fields are accepted."
        },
        "DirectJsonLogin": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Obtain token using the `/api/auth/login/json` endpoint with JSON body containing email/password or username/password."
        },
        "SimpleJsonLogin": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "NEW: Use the `/api/auth/json-login` endpoint for a cleaner JSON login experience with more user info returned."
        }
    }
    
    # Add global security with all options
    openapi_schema["security"] = [
        {"OAuth2PasswordBearer": []},
        {"DirectJsonLogin": []},
        {"SimpleJsonLogin": []}
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Print all routes for debugging
print("\nAPI Routes:")
for route in app.routes:
    try:
        if hasattr(route, "methods"):
            print(f"{route.path} - {route.methods}")
        else:
            # This is a WebSocket route or another type of route without methods
            print(f"{route.path} - WebSocket/Other")
    except AttributeError:
        # Fallback for any route type we didn't anticipate
        print(f"{route.path} - Unknown route type: {type(route).__name__}")

# Add a route to serve test.html directly under /api/v1/test
@app.get(f"{settings.API_V1_STR}/test", response_class=HTMLResponse)
async def get_test_html():
    try:
        with open(static_dir / "test.html", "r") as file:
            content = file.read()
        return HTMLResponse(content=content)
    except Exception as e:
        logger.error(f"Error serving test.html: {str(e)}")
        return HTMLResponse(content="<html><body><h1>Error loading test page</h1></body></html>")

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = datetime.now().strftime("%Y%m%d%H%M%S")
    logger.error(f"Error ID: {error_id}")
    logger.error(f"Request: {request.method} {request.url}")
    logger.error(f"Exception: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "error_id": error_id
        }
    )

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API. See /docs for documentation or /api/v1/test for the chat test page."}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}")
    response = await call_next(request)
    return response

# Initialize database tables and reference data before starting the app
try:
    initialize_database()
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize database: {str(e)}")
    # You might want to exit if database initialization fails
    # import sys
    # sys.exit(1)
