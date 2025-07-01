# MediHub Backend API Documentation

## Overview
The MediHub API is a comprehensive healthcare application backend built with FastAPI. It provides endpoints for managing users, patients, doctors, appointments, medical records, and more.

**Base URL**: `http://localhost:8000/api`  
**API Version**: 1.0.0  
**Authentication**: JWT Bearer Token

## Authentication System

### 1. Login Endpoints

#### Standard Login (OAuth2 Compatible)
- **Endpoint**: `POST /auth/login`
- **Description**: Supports multiple authentication methods
- **Content Types**: Form data, JSON
- **Usage**: 
  - Swagger UI: Enter email in 'username' field
  - Form data: email/password or username/password
  - JSON: `{"email": "user@example.com", "password": "yourpassword"}`

#### Direct JSON Login
- **Endpoint**: `POST /auth/login/json`
- **Description**: Simple JSON-only login endpoint
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
  Or:
  ```json
  {
    "username": "user@example.com",
    "password": "yourpassword"
  }
  ```

#### Simplified JSON Login (NEW)
- **Endpoint**: `POST /auth/json-login`
- **Description**: Clean JSON-only interface with more user information returned
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```

### 2. User Registration
- **Endpoint**: `POST /auth/signup`
- **Description**: Register a new user with patient role and create a patient record
- **Request Body**: UserSignup schema (requires gender field)

### 3. Authentication Response
All login endpoints return:
```json
{
  "access_token": "jwt_token_here",
  "token_type": "bearer",
  "user_id": 123,
  "role_id": 1,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

## User Management

### Current User Information
- **Endpoint**: `GET /users/me`
- **Authentication**: Required
- **Description**: Get information about the currently authenticated user
- **Response**:
  ```json
  {
    "user_id": 123,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role_id": 1,
    "role_name": "admin",
    "phone": "1234567890"
  }
  ```

### User CRUD Operations
- **GET /users/**: Get all users (Admin only)
- **POST /users/**: Create new user (Admin only)
- **GET /users/{user_id}**: Get specific user
- **PUT /users/{user_id}**: Update user (Admin only)
- **DELETE /users/{user_id}**: Delete user (Admin only)

## Role-Based Access Control

### Roles Management
- **GET /roles/**: Get all roles
- **POST /roles/**: Create new role (Admin only)
- **GET /roles/{role_id}**: Get specific role
- **PUT /roles/{role_id}**: Update role (Admin only)
- **DELETE /roles/{role_id}**: Delete role (Admin only)

### Role Types
Based on the authentication response, the system supports these roles:
- **admin** (role_id: 1)
- **doctor** (role_id: 2)
- **patient** (role_id: 3)

## Doctor Management

### Doctor Operations
- **GET /doctors**: Get all doctors
- **POST /doctors/**: Create new doctor (Admin only)
- **GET /doctors/{doctor_id}**: Get specific doctor

### Doctor Scheduling
- **POST /doctors/{doctor_id}/calendar**: Create doctor calendar
- **POST /doctors/{doctor_id}/timeslots**: Create timeslots for doctor
- **POST /doctors/{doctor_id}/bulk-timeslots**: Create multiple timeslots
- **POST /doctors/{doctor_id}/schedule**: Create weekly schedule

### Doctor Response Schema
```json
{
  "doctor_id": 1,
  "user_id": 123,
  "email": "doctor@example.com",
  "first_name": "Dr. John",
  "last_name": "Smith",
  "phone_number": "1234567890",
  "address": "123 Medical Center",
  "specialty": "Cardiology",
  "qualifications": "MD, FACC",
  "years_of_experience": 10,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

## Patient Management

### Patient Operations
- **GET /patients**: Get all patients (Authentication required)
- **GET /patients/{patient_id}**: Get specific patient

### Patient Health Records
- **GET /patients/{patient_id}/allergies**: Get patient allergies
- **POST /patients/{patient_id}/allergies**: Add patient allergy
- **PUT /patients/{patient_id}/allergies/{allergy_id}**: Update allergy
- **DELETE /patients/{patient_id}/allergies/{allergy_id}**: Delete allergy

- **GET /patients/{patient_id}/medications**: Get patient medications
- **POST /patients/{patient_id}/medications**: Add patient medication
- **PUT /patients/{patient_id}/medications/{medication_id}**: Update medication
- **DELETE /patients/{patient_id}/medications/{medication_id}**: Delete medication

## Appointment System

### Appointment Management
- **GET /appointments/**: Get user appointments (current user)
- **POST /appointments/**: Create new appointment
- **GET /appointments/{appointment_id}**: Get appointment details
- **PUT /appointments/{appointment_id}**: Update appointment
- **DELETE /appointments/{appointment_id}**: Cancel appointment

### Appointment Creation Schema
```json
{
  "slot_id": 123,
  "notes": "Routine checkup",
  "priority_flag": false,
  "patient_id": 456
}
```

## Time Slot Management

### Time Slot Operations
- **GET /timeslots/**: Get available timeslots
- **POST /timeslots/**: Create new timeslot (Doctor only)
- **GET /timeslots/{slot_id}**: Get timeslot details
- **PUT /timeslots/{slot_id}**: Update timeslot (Doctor only)
- **DELETE /timeslots/{slot_id}**: Delete timeslot (Doctor only)
- **POST /timeslots/bulk**: Create multiple timeslots (Doctor only)

### Query Parameters for Timeslots
- `doctor_id`: Filter by specific doctor
- `start_date`: Filter from specific date
- `end_date`: Filter until specific date

## Medical Records

### Medical Record Operations
- **POST /medical-records/**: Create new medical record (Doctor only)
- **GET /medical-records/{record_id}**: Get medical record details
- **PUT /medical-records/{record_id}**: Update medical record (Doctor only)
- **DELETE /medical-records/{record_id}**: Delete medical record (Admin only)
- **GET /medical-records/patient/{patient_id}**: Get patient medical records

### Medical Record Schema
```json
{
  "patient_id": 1,
  "appointment_id": 5,
  "diagnosis": "Seasonal allergies",
  "prescriptions": "Cetirizine 10mg daily",
  "lab_results": "Normal blood work"
}
```

## Department & Specialization Management

### Departments
- **GET /departments/**: Get all departments
- **POST /departments/**: Create new department (Admin only)
- **GET /departments/{department_id}**: Get specific department
- **PUT /departments/{department_id}**: Update department (Admin only)
- **DELETE /departments/{department_id}**: Delete department (Admin only)

### Specializations
- **GET /specializations**: Get all specializations
- **POST /specializations**: Create new specialization (Admin only)
- **GET /specializations/{specialization_id}**: Get specialization details
- **PUT /specializations/{specialization_id}**: Update specialization (Admin only)
- **DELETE /specializations/{specialization_id}**: Delete specialization (Admin only)

## Communication System

### Chat System
- **GET /chat/contacts**: Get chat contacts
- **GET /chat/messages**: Get messages with specific contact
- **POST /chat/send**: Send new message
- **PUT /chat/messages/{message_id}/read**: Mark message as read
- **PUT /chat/messages/read-all**: Mark all messages from sender as read

### Message Schema
```json
{
  "receiver_id": 123,
  "message": "Hello, how are you?",
  "is_urgent": false,
  "message_type": "text"
}
```

### Chatbot Integration
- **POST /chatbot**: Query the chatbot
- **GET /chatbot/history**: Get chatbot conversation history
- **POST /chatbot/chatbot/query**: Alternative chatbot query endpoint
- **GET /chatbot/chatbot/history**: Alternative chatbot history endpoint

### Chatbot Query Schema
```json
{
  "query": "I have a headache, what should I do?"
}
```

## Insurance Management

### Insurance Operations
- **GET /insurance/**: Get all insurance providers
- **POST /insurance/**: Create new insurance record (Admin only)
- **GET /insurance/{insurance_id}**: Get insurance provider details
- **PUT /insurance/{insurance_id}**: Update insurance provider (Admin only)
- **DELETE /insurance/{insurance_id}**: Delete insurance provider (Admin only)

### Insurance Schema
```json
{
  "provider": "Blue Cross Blue Shield",
  "policy_number": "POL123456789",
  "coverage_details": "80% coverage for in-network providers, $1000 deductible"
}
```

## Notification System

### Notification Operations
- **POST /notifications/**: Create notification
- **GET /notifications/**: Get notifications (with pagination)
- **PUT /notifications/{notification_id}/read**: Mark notification as read
- **PUT /notifications/read-all**: Mark all notifications as read
- **DELETE /notifications/{notification_id}**: Delete notification

### Notification Query Parameters
- `limit`: Number of notifications to return
- `offset`: Number of notifications to skip

## Frontend Integration Guide

### 1. Authentication Flow
```javascript
// Login
const loginResponse = await fetch('/api/auth/login/json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const authData = await loginResponse.json();
// Store authData.access_token for subsequent requests
```

### 2. Making Authenticated Requests
```javascript
// Set Authorization header
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### 3. Role-Based Dashboard Redirection
```javascript
// After login, get user info
const userResponse = await fetch('/api/users/me', { headers });
const user = await userResponse.json();

// Redirect based on role
switch(user.role_name.toLowerCase()) {
  case 'admin':
    navigate('/admin/dashboard');
    break;
  case 'doctor':
    navigate('/doctor/dashboard');
    break;
  case 'patient':
    navigate('/patient/dashboard');
    break;
}
```

### 4. Error Handling
The API returns standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error

### 5. Validation Errors
Validation errors return the format:
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["field_name"],
      "msg": "Error message"
    }
  ]
}
```

## Security Features

### Authentication Methods
1. **OAuth2 Password Bearer**: Standard OAuth2 flow
2. **Direct JSON Login**: Simple bearer token authentication
3. **Simple JSON Login**: Enhanced bearer token with user info

### Authorization Levels
- **Public**: No authentication required
- **Authenticated**: Valid JWT token required
- **Doctor Only**: Must have doctor role
- **Admin Only**: Must have admin role

### CORS Configuration
The backend is configured to accept requests from:
- `http://localhost:3000` (Frontend development)
- `http://127.0.0.1:3000`
- `http://0.0.0.0:3000`
- Backend URLs for internal communication

## Database Schema Considerations

### Table Naming Convention
- All table names are in UPPERCASE (e.g., `USERS`, `ROLES`, `DOCTORS`)
- This is important for MySQL case sensitivity

### Key Relationships
- Users → Roles (Many-to-One)
- Doctors → Users (One-to-One)
- Patients → Users (One-to-One)
- Appointments → Patients, Doctors, Timeslots
- Medical Records → Patients, Doctors

## Testing Endpoints

### Test Endpoint
- **GET /api/v1/test**: Returns test HTML
- **GET /**: Root endpoint

This documentation provides a comprehensive guide for frontend developers to integrate with the MediHub backend API. Each endpoint includes authentication requirements, request/response schemas, and practical usage examples.
