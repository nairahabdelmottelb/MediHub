from app.config.database import db
import logging

logger = logging.getLogger(__name__)

def initialize_database():
    """Initialize the database with required reference data."""
    try:
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                # Check if ROLES table exists, create if not
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS ROLES (
                        role_id INT PRIMARY KEY AUTO_INCREMENT,
                        role_name VARCHAR(50) NOT NULL UNIQUE
                    )
                """)
                
                # Check if roles exist
                cursor.execute("SELECT COUNT(*) as count FROM ROLES")
                result = cursor.fetchone()
                
                if not result or result['count'] == 0:
                    # Insert basic roles
                    roles = [
                        (1, "admin"),
                        (2, "doctor"),
                        (3, "patient"),
                        (4, "management")
                    ]
                    cursor.executemany(
                        "INSERT INTO ROLES (role_id, role_name) VALUES (%s, %s)",
                        roles
                    )
                    logger.info("Roles initialized successfully")
                
        logger.info("Database initialization complete")
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise 