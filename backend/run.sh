#!/bin/bash

if [ -d "venv" ]; then
    source venv/bin/activate
fi


pip install -r requirements.txt


/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 