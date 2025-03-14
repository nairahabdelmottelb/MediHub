from fastapi import APIRouter
from app.api.endpoints import (
    auth, users, roles, departments, specializations, 
    doctors, patients, appointments, medical_records,
    timeslots, chat, chatbot, insurance, notifications
)

api_router = APIRouter()

# Auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# User management routes
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Role management routes
api_router.include_router(roles.router, prefix="/roles", tags=["roles"])

# Department management routes
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])

# Specialization management routes
api_router.include_router(specializations.router, prefix="/specializations", tags=["specializations"])

# Doctor management routes
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])

# Patient management routes
api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])

# Appointment management routes
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])

# Medical record management routes
api_router.include_router(medical_records.router, prefix="/medical-records", tags=["Medical Records"])

# Timeslot management routes
api_router.include_router(timeslots.router, prefix="/timeslots", tags=["timeslots"])

# Chat routes
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])

# Chatbot routes
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])

# Insurance routes
api_router.include_router(insurance.router, prefix="/insurance", tags=["Insurance"])

# Notification routes
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Print all routes for debugging
print("\nAPI Routes:")
for route in api_router.routes:
    if hasattr(route, "methods"):
        print(f"{route.path} - {route.methods}")
    else:
        # This is a WebSocket route
        print(f"{route.path} - WebSocket") 













