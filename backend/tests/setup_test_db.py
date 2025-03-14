import os
import sys
import pymysql
from dotenv import load_dotenv
from pymysql.cursors import DictCursor

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load environment variables
load_dotenv("/home/seth0x41/MediHub/backend/.env")

def setup_test_database():
    """Setup test database with required tables"""
    conn = pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        db=os.getenv("DB_NAME"),
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True
    )
    
    with conn.cursor() as cursor:
        # Create basic tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ROLES (
                role_id INT PRIMARY KEY AUTO_INCREMENT,
                role_name VARCHAR(50) UNIQUE NOT NULL,
                role_description TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS USERS (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                role_id INT,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (role_id) REFERENCES ROLES(role_id)
            )
        """)
        
        # Create DEPARTMENTS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS DEPARTMENTS (
                department_id INT AUTO_INCREMENT PRIMARY KEY,
                department_name VARCHAR(100) NOT NULL,
                department_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                updated_by INT,
                FOREIGN KEY (created_by) REFERENCES USERS(user_id),
                FOREIGN KEY (updated_by) REFERENCES USERS(user_id)
            )
        """)
        
        # Create AUDIT_LOGS table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INT,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES USERS(user_id)
            )
        """)
        
        print("Test database tables created successfully")
    conn.close()

if __name__ == "__main__":
    setup_test_database() 