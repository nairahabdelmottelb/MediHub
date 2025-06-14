#!/bin/bash

if [ -d "venv" ]; then
    source venv/bin/activate
fi


pip install -r requirements.txt


/usr/bin/python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000 