USE medihub;
CREATE TABLE DEPARTMENTS (
    department_id INT PRIMARY KEY AUTO_INCREMENT,
    department_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE SPECIALIZATIONS (
    spec_id INT PRIMARY KEY AUTO_INCREMENT,
    spec_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE ROLES (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE INSURANCE (
    insurance_id INT PRIMARY KEY AUTO_INCREMENT,
    provider VARCHAR(100) NOT NULL,
    policy_number VARCHAR(50) NOT NULL,
    coverage_details TEXT
);

CREATE TABLE USERS (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role_id INT NOT NULL,
    consent_timestamp DATETIME,
    FOREIGN KEY (role_id) REFERENCES ROLES(role_id)
);

CREATE TABLE PATIENTS (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    insurance_id INT,
    data_anonym_flag BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (insurance_id) REFERENCES INSURANCE(insurance_id)
);

CREATE TABLE DOCTORS (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    spec_id INT NOT NULL,
    department_id INT NOT NULL,
    years_of_exp INT,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (spec_id) REFERENCES SPECIALIZATIONS(spec_id),
    FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id)
);

CREATE TABLE MANAGEMENT (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    department_id INT NOT NULL,
    perm_level VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    FOREIGN KEY (department_id) REFERENCES DEPARTMENTS(department_id)
);

CREATE TABLE DOCTOR_CALENDAR (
    calendar_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    availability BOOLEAN DEFAULT TRUE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id)
);

CREATE TABLE TIMESLOTS (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    calendar_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (calendar_id) REFERENCES DOCTOR_CALENDAR(calendar_id)
);

CREATE TABLE APPOINTMENTS (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    slot_id INT NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL,
    notes TEXT,
    priority_flag BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id),
    FOREIGN KEY (slot_id) REFERENCES TIMESLOTS(slot_id)
);

CREATE TABLE MEDICAL_RECORDS (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT,
    diagnosis TEXT,
    prescriptions TEXT,
    lab_results TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id),
    FOREIGN KEY (appointment_id) REFERENCES APPOINTMENTS(appointment_id)
);

CREATE TABLE AI_MODELS (
    model_id INT PRIMARY KEY AUTO_INCREMENT,
    version VARCHAR(50) NOT NULL,
    training_data_start DATE,
    training_data_end DATE,
    accuracy_metrics FLOAT,
    deployed_at DATETIME
);

CREATE TABLE DIAGNOSIS_AI (
    diagnosis_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    model_id INT NOT NULL,
    ai_summary TEXT,
    predictive_diagnosis TEXT,
    confidence_score FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id),
    FOREIGN KEY (model_id) REFERENCES AI_MODELS(model_id)
);

CREATE TABLE DIAGNOSIS_FEEDBACK (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    diagnosis_id INT NOT NULL,
    doctor_rating INT,
    correction_notes TEXT,
    feedback_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diagnosis_id) REFERENCES DIAGNOSIS_AI(diagnosis_id)
);

CREATE TABLE BILLING (
    billing_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Paid', 'Overdue') NOT NULL,
    payment_date DATE,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id)
);

CREATE TABLE PAYMENTS (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    billing_id INT NOT NULL,
    transaction_status VARCHAR(50),
    payment_method VARCHAR(50),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    gateway_response TEXT,
    FOREIGN KEY (billing_id) REFERENCES BILLING(billing_id)
);

CREATE TABLE PATIENT_ALLERGIES (
    allergy_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    allergy_name VARCHAR(100) NOT NULL,
    severity ENUM('Mild', 'Moderate', 'Severe'),
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id)
);

CREATE TABLE PATIENT_MEDS (
    medication_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    medication_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id)
);

CREATE TABLE PERMISSIONS (
    perm_id INT PRIMARY KEY AUTO_INCREMENT,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL
);

CREATE TABLE AUDIT_LOGS (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    actor_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_entity VARCHAR(50),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (actor_id) REFERENCES USERS(user_id)
);

CREATE TABLE NOTIFICATIONS (
    notif_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_type ENUM('Email', 'SMS', 'Push'),
    content TEXT,
    sent_status BOOLEAN DEFAULT FALSE,
    delivery_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

CREATE TABLE CHAT_MESSAGES (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_urgent BOOLEAN DEFAULT FALSE,
    read_status BOOLEAN DEFAULT FALSE,
    message_type ENUM('Text', 'Image', 'File'),
    FOREIGN KEY (sender_id) REFERENCES USERS(user_id),
    FOREIGN KEY (receiver_id) REFERENCES USERS(user_id)
);

CREATE TABLE CHATBOT_LOGS (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    symptoms TEXT,
    doctor_id INT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES PATIENTS(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES DOCTORS(doctor_id)
);