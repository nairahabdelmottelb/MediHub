# MediHub ML Models API

This directory contains the ML models and API services for the MediHub application. The API is built using FastAPI and provides a scalable architecture for serving multiple machine learning models.

## Architecture

The ML models API is designed with the following architecture:

- **`main.py`**: Main FastAPI application that serves as the entry point
- **`base_model.py`**: Base class for all ML model services
- **`model_registry.py`**: Registry to manage and access all ML models
- **`text_summarization.py`**: Text summarization service using DistilBART
- **`__init__.py`**: Package initialization file

## Features

- **Multi-model support**: Can serve multiple ML models through a single API
- **Extensible architecture**: Easy to add new models by extending BaseModelService
- **Health checks**: Monitor the status of all loaded models
- **CORS support**: Configured for cross-origin requests
- **Comprehensive API documentation**: Auto-generated docs at `/docs`

## Available Models

### Text Summarization
- **Model**: DistilBART (sshleifer/distilbart-cnn-12-6)
- **Endpoint**: `/summarize` (legacy) or `/predict` (generic)
- **Purpose**: Summarizes long text into shorter, coherent summaries

## API Endpoints

### Core Endpoints
- `GET /`: API information and available endpoints
- `GET /models`: List all available models and their status
- `POST /predict`: Generic prediction endpoint for any model
- `GET /health`: Health check for all models

### Model-Specific Endpoints
- `POST /summarize`: Text summarization (legacy endpoint)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the API:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Or simply:
```bash
python main.py
```

## Usage Examples

### Generic Prediction Endpoint
```python
import requests

# Text summarization using generic endpoint
response = requests.post("http://localhost:8000/predict", json={
    "model_name": "text_summarization",
    "input_data": {
        "text": "Your long text here...",
        "max_length": 150,
        "min_length": 30
    }
})
```

### Legacy Text Summarization Endpoint
```python
import requests

response = requests.post("http://localhost:8000/summarize", json={
    "text": "Your long text here...",
    "max_length": 150,
    "min_length": 30
})
```

### List Available Models
```python
import requests

response = requests.get("http://localhost:8000/models")
print(response.json())
```

## Adding New Models

To add a new ML model:

1. Create a new service file (e.g., `new_model.py`)
2. Extend the `BaseModelService` class
3. Implement the required methods: `load_model()` and `predict()`
4. Register the model in `model_registry.py`

Example:
```python
from .base_model import BaseModelService

class NewModelService(BaseModelService):
    def __init__(self):
        super().__init__()
        self.model_name = "New Model"
        self.load_model()
    
    def load_model(self):
        # Load your model here
        pass
    
    def predict(self, input_data):
        # Implement prediction logic
        return {"result": "prediction"}
```

## Development

The API includes:
- Automatic API documentation at `http://localhost:8000/docs`
- Interactive API testing at `http://localhost:8000/redoc`
- Health monitoring at `http://localhost:8000/health`

## Error Handling

The API includes comprehensive error handling:
- Model not found errors (404)
- Model loading errors (503)
- Prediction errors (500)
- Input validation errors (422)

## Logging

All operations are logged with appropriate log levels for monitoring and debugging.

## Environment Configuration

The API server uses environment variables for configuration. Create a `.env` file in this directory with the following variables:

```bash
# Server Configuration
MODEL_HOST=127.0.0.1
MODEL_PORT=8080

# CORS Settings
ALLOWED_ORIGINS=*
```

### Environment Variables

- `MODEL_HOST`: The host address to bind the server to (default: 127.0.0.1)
- `MODEL_PORT`: The port number to run the server on (default: 8080)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (default: *)

### Frontend Integration

The frontend is configured to use the model API through environment variables. In the frontend `.env` file:

```bash
VITE_MODELS_API_URL=http://127.0.0.1:8080
```

The frontend uses a utility function `getModelApiUrl()` from `utils/modelApiConfig.ts` to construct API URLs dynamically based on the environment configuration.
