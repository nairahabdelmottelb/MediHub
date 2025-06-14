import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
import logging
import os
from dotenv import load_dotenv
from fastapi import HTTPException

def list_files_in_path(path):
    try:
        files = os.listdir(path)
        print(f"Files in '{path}': {files}")
    except Exception as e:
        logger.error(f"Error listing files in path '{path}': {str(e)}")
        raise

list_files_in_path(".")

dotenv_loaded = load_dotenv("./.env")
if not dotenv_loaded:
    logging.warning("Failed to load .env file. Ensure it exists in the correct path.")


logger = logging.getLogger(__name__)

class DatabaseError(Exception):
    """Custom exception for database errors"""
    pass

class Database:
    def __init__(self):
        self.config = {
            "host": os.getenv("DB_HOST"),
            "user": os.getenv("DB_USER"),
            "password": os.getenv("DB_PASSWORD"),
            "db": os.getenv("DB_NAME"),
            "charset": "utf8mb4",
            "cursorclass": DictCursor,
            "autocommit": False
        }
        self.connection = None

    def init_db(self):
        """Initialize database connection"""
        logger.info("Initializing database connection")
        try:
            # Test connection
            conn = pymysql.connect(**self.config)
            conn.close()
            logger.info("Database connection successful")
        except Exception as e:
            logger.error(f"Failed to initialize database: {str(e)}")
            raise DatabaseError(f"Failed to initialize database: {str(e)}")

    def close_db(self):
        """Close database connection"""
        logger.info("Closing database connection")
        if self.connection:
            self.connection.close()
            self.connection = None

    @contextmanager
    def get_db(self):
        conn = pymysql.connect(**self.config)
        try:
            yield conn
        except HTTPException:
            # Let HTTPExceptions pass through without modification
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {str(e)}")
            raise DatabaseError(f"Database operation failed: {str(e)}")
        finally:
            conn.close()

    @contextmanager
    def transaction(self):
        with self.get_db() as conn:
            try:
                yield conn
                conn.commit()
            except HTTPException:
                # Let HTTPExceptions pass through without modification
                conn.rollback()
                raise
            except Exception as e:
                conn.rollback()
                logger.error(f"Transaction failed: {str(e)}")
                raise DatabaseError(f"Transaction failed: {str(e)}")

db = Database()
