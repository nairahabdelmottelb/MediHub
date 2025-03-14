#!/bin/bash

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install dependencies
pip install -r requirements.txt

# Run the application
/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 