import os
import sys
import pymysql
from dotenv import load_dotenv

# Load environment variables
load_dotenv("/home/seth0x41/MediHub/backend/.env")

def setup_test_database():
    """Create test database tables with the correct schema"""
    conn = pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        db=os.getenv("DB_NAME"),
        charset="utf8mb4",
        autocommit=True
    )
    
    try:
        with conn.cursor() as cursor:
            # Read and execute the schema.sql file
            with open("/home/seth0x41/MediHub/backend/schema.sql", "r") as f:
                schema_sql = f.read()
                
            # Split the SQL file into individual statements
            statements = schema_sql.split(';')
            
            for statement in statements:
                if statement.strip():
                    try:
                        cursor.execute(statement)
                        print(f"Executed: {statement[:50]}...")
                    except Exception as e:
                        print(f"Error executing: {statement[:50]}...: {str(e)}")
            
            print("Test database setup completed")
    finally:
        conn.close()

if __name__ == "__main__":
    setup_test_database() 