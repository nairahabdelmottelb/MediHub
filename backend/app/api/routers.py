from fastapi import APIRouter
from app.api.endpoints import users, auth, chat, appointments, medical_records, doctors

# Main API router
api_router = APIRouter()

# Include router for each feature with appropriate prefix
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["Medical Records"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctors"]) 