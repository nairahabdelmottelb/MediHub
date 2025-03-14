# This file is intentionally left empty 

# Import all endpoint modules
from fastapi import APIRouter

api_router = APIRouter()

# Import the endpoint modules
from . import auth
from . import users
from . import roles
from . import departments
from . import specializations
from . import doctors
from . import patients
from . import appointments
from . import medical_records
from . import timeslots
from . import chat
from . import chatbot
# from . import prescriptions  # Commented out since it doesn't exist yet
# from . import insurance  # Commented out since it doesn't exist yet