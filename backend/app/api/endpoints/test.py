import sys
import os
import logging

# Add the backend root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.config.database import db, DatabaseError  # استيراد db و DatabaseError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_regular_role():
    """Add a 'regular' role to the ROLES table."""
    try:
        with db.transaction() as conn:
            with conn.cursor() as cursor:
                # Insert the 'regular' role, or do nothing if it already exists
                cursor.execute(
                    """
                    INSERT INTO ROLES (role_name)
                    VALUES (%s)
                    ON DUPLICATE KEY UPDATE role_name = role_name
                    """,
                    ("regular",)
                )
                # Get the last inserted ID (or 1 if it already existed)
                role_id = cursor.lastrowid or 1
                logger.info(f"Role 'regular' added or already exists with role_id: {role_id}")

            # Verify the insertion
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT role_id, role_name FROM ROLES WHERE role_name = %s",
                    ("regular",)
                )
                result = cursor.fetchone()
                if not result:
                    raise DatabaseError("Failed to verify 'regular' role after insertion")
                
                logger.info(f"Verified: role_id={result['role_id']}, role_name={result['role_name']}")

    except DatabaseError as e:
        logger.error(f"Database error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise

if __name__ == "__main__":
    logger.info("Starting script to add 'regular' role...")
    try:
        add_regular_role()
        logger.info("Script completed successfully!")
    except Exception as e:
        logger.error(f"Script failed: {str(e)}")
        sys.exit(1)