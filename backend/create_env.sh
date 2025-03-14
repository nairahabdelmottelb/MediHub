#!/bin/bash

ENV_FILE="/home/seth0x41/MediHub/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating default .env file..."
    cat > "$ENV_FILE" << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=medihub
SECRET_KEY=$(openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
    echo ".env file created with default values."
else
    echo ".env file already exists."
fi

chmod 600 "$ENV_FILE" 