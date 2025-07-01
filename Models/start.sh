#!/bin/bash

# MediHub ML Models API Startup Script

echo "Starting MediHub ML Models API..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pip3 install -r requirements.txt

# Start the API server
echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8080 --reload

echo "API is running at http://localhost:8080"
echo "API documentation available at http://localhost:8080/docs"
