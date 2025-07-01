import logging
import uvicorn
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import base64
from io import BytesIO
import numpy as np

from model_registry import model_registry
from text_summarization import TextToSummarize

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MediHub ML Models API",
    description="A comprehensive API for serving multiple ML models for the MediHub application",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Generic request/response models
class PredictionRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    model_name: str
    input_data: Dict[str, Any]

class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    model_name: str
    result: Dict[str, Any]
    status: str

class TranscriptionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    transcription: str
    model_type: str
    confidence: float
    status: str

class BreastCancerAnalysisRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    image_data: str  # Base64 encoded image
    include_segmentation: bool = True
    return_visualizations: bool = True

class BreastCancerAnalysisResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    classification: Dict[str, Any]
    segmentation: Optional[Dict[str, Any]] = None
    visualizations: Optional[Dict[str, str]] = None
    analysis_metadata: Dict[str, Any]
    status: str

class BrainTumorAnalysisRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    image_data: str  # Base64 encoded image
    detailed_analysis: bool = True
    return_visualizations: bool = True

class BrainTumorAnalysisResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    classification: Dict[str, Any]
    medical_info: Optional[Dict[str, str]] = None
    visualizations: Optional[Dict[str, str]] = None
    analysis_metadata: Dict[str, Any]
    status: str

class OncologyAnalysisRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    image_data: str  # Base64 encoded image
    detailed_analysis: bool = True
    return_visualizations: bool = True

class OncologyAnalysisResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    classification: Dict[str, Any]
    medical_info: Optional[Dict[str, str]] = None
    visualizations: Optional[Dict[str, str]] = None
    analysis_metadata: Dict[str, Any]
    status: str

@app.get("/")
def read_root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to MediHub ML Models API",
        "version": "2.0.0",
        "description": "API for serving multiple ML models",
        "endpoints": {
            "models": "/models - List all available models",
            "predict": "/predict - Make predictions using any model", 
            "summarize": "/summarize - Text summarization (legacy endpoint)",
            "transcription": "/transcription - Audio transcription",
            "transcriptions": "/transcriptions - Audio transcription (frontend compatible)",
            "breast_cancer_analysis": "/breast-cancer/analyze - Breast cancer image analysis (JSON response)",
            "breast_cancer_upload": "/breast-cancer/analyze-upload - Breast cancer analysis from file upload (returns composite visualization image)",
            "brain_tumor_analysis": "/brain-tumor/analyze - Brain tumor MRI analysis (JSON response)",
            "brain_tumor_upload": "/brain-tumor/analyze-upload - Brain tumor analysis from file upload (returns detailed visualization image)",
            "oncology_analysis": "/oncology/analyze - Lung and colon cancer histopathological analysis (JSON response)",
            "oncology_upload": "/oncology/analyze-upload - Oncology analysis from file upload (returns detailed visualization image)",
            "breast_cancer_detailed": "/breast-cancer/analyze-detailed - Breast cancer analysis with detailed JSON results",
            "docs": "/docs - API documentation"
        }
    }

@app.get("/models")
def list_models():
    """List all available ML models and their status"""
    try:
        models = model_registry.list_models()
        return {
            "status": "success",
            "models": models,
            "total_models": len(models)
        }
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve models list")

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """Make predictions using any registered ML model"""
    try:
        # Get the model
        model = model_registry.get_model(request.model_name)
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail=f"Model '{request.model_name}' is not healthy"
            )
        
        # Make prediction
        result = model.predict(request.input_data)
        
        return PredictionResponse(
            model_name=request.model_name,
            result=result,
            status="success"
        )
        
    except ValueError as e:
        logger.error(f"Model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/transcription", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    model_type: Optional[str] = Form("", description="Transcription model type: '', 'medical_conversation', or 'medical_dictation'")
):
    """Transcribe audio using Google Cloud Speech-to-Text API"""
    try:
        # Validate file type
        if not audio.content_type or not audio.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an audio file."
            )
        
        # Read audio data
        audio_data = await audio.read()
        
        if len(audio_data) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Get transcription model
        transcription_service = model_registry.get_model("audio_transcription")
        
        # Check if service is healthy
        if not transcription_service.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Audio transcription service is not available"
            )
        
        # Prepare input data
        input_data = {
            "audio_data": audio_data,
            "model_type": model_type if model_type in ["", "medical_conversation", "medical_dictation"] else ""
        }
        
        # Perform transcription
        result = transcription_service.predict(input_data)
        
        return TranscriptionResponse(
            transcription=result["transcription"],
            model_type=result["model_type"],
            confidence=result["confidence"],
            status="success"
        )
        
    except ValueError as e:
        logger.error(f"Transcription service not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/transcriptions", response_model=TranscriptionResponse)
async def transcribe_audio_plural(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form("en", description="Language code"),
    format: Optional[str] = Form("detailed", description="Response format")
):
    """Transcribe audio file - Frontend compatible endpoint"""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith(('audio/', 'video/')):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an audio or video file."
            )
        
        # Get transcription model
        transcription_service = model_registry.get_model("audio_transcription")
        
        # Check if service is healthy  
        if not transcription_service.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Audio transcription service is not available"
            )
        
        # Use the transcribe_file method for frontend compatibility
        result = transcription_service.transcribe_file(file)
        
        return TranscriptionResponse(
            transcription=result["transcription"],
            model_type="audio_transcription",
            confidence=result["confidence"],
            status="success"
        )
        
    except ValueError as e:
        logger.error(f"Transcription service not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/summarize")
def summarize(request: TextToSummarize):
    """Legacy text summarization endpoint"""
    try:
        # Use the text summarization model
        model = model_registry.get_model("text_summarization")
        
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Text summarization model is not available"
            )
        
        # Prepare input data
        input_data = {
            "text": request.text,
            "max_length": getattr(request, 'max_length', 150),
            "min_length": getattr(request, 'min_length', 30)
        }
        
        result = model.predict(input_data)
        
        return {
            "summary": result["summary"],
            "status": "success"
        }
        
    except ValueError as e:
        logger.error(f"Model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/breast-cancer/analyze", response_model=BreastCancerAnalysisResponse)
def analyze_breast_cancer(request: BreastCancerAnalysisRequest):
    """Analyze breast cancer from base64 encoded image"""
    try:
        # Get the breast cancer analysis model
        model = model_registry.get_model("breast_cancer_analysis")
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Breast cancer analysis model is not available"
            )
        
        # Prepare input data
        input_data = {
            "image_data": request.image_data,
            "include_segmentation": request.include_segmentation,
            "return_visualizations": request.return_visualizations
        }
        
        # Perform analysis
        result = model.predict(input_data)
        
        return BreastCancerAnalysisResponse(
            classification=result["classification"],
            segmentation=result.get("segmentation"),
            visualizations=result.get("visualizations"),
            analysis_metadata=result["analysis_metadata"],
            status="success"
        )
        
    except ValueError as e:
        logger.error(f"Breast cancer analysis model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Breast cancer analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/breast-cancer/analyze-upload")
async def analyze_breast_cancer_upload(
    image: UploadFile = File(..., description="Breast ultrasound image to analyze")
):
    """Analyze breast cancer from uploaded image file and return composite visualization"""
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Get the breast cancer analysis model
        model = model_registry.get_model("breast_cancer_analysis")
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Breast cancer analysis model is not available"
            )
        
        # Load and analyze the image
        from PIL import Image
        original_image = Image.open(BytesIO(image_data))
        
        # Perform classification
        cls_tensor = model.preprocess_image_for_classification(original_image)
        predicted_class, confidence, class_probabilities = model.classify_image(cls_tensor)
        
        # Perform segmentation
        seg_tensor = model.preprocess_image_for_segmentation(original_image)
        mask_raw, mask_binary = model.segment_image(seg_tensor, original_image.size)
        
        # Create composite visualization (3-panel view)
        composite_image = model.create_overlay_visualization(
            original_image, mask_binary, predicted_class, confidence
        )
        
        # Convert composite image to bytes for response
        img_buffer = BytesIO()
        composite_image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Calculate tumor area percentage
        tumor_area_percentage = float(np.sum(mask_binary) / mask_binary.size * 100) if mask_binary.size > 0 else 0.0
        
        return StreamingResponse(
            img_buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=breast_cancer_analysis_{predicted_class}.png",
                "X-Analysis-Result": f"Class: {predicted_class}, Confidence: {confidence:.2%}",
                "X-Risk-Level": model._get_risk_level(predicted_class, confidence),
                "X-Tumor-Detected": str(bool(np.any(mask_binary))),
                "X-Tumor-Area": f"{tumor_area_percentage:.2f}%"
            }
        )
        
    except ValueError as e:
        logger.error(f"Breast cancer analysis model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Breast cancer analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/breast-cancer/analyze-detailed", response_model=BreastCancerAnalysisResponse)
async def analyze_breast_cancer_detailed(
    image: UploadFile = File(..., description="Breast ultrasound image to analyze"),
    include_segmentation: bool = Form(True, description="Include tumor segmentation analysis"),
    return_visualizations: bool = Form(True, description="Return visualization images as base64")
):
    """Analyze breast cancer from uploaded image file and return detailed JSON results"""
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Get the breast cancer analysis model
        model = model_registry.get_model("breast_cancer_analysis")
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Breast cancer analysis model is not available"
            )
        
        # Prepare input data
        input_data = {
            "image_data": image_data,
            "include_segmentation": include_segmentation,
            "return_visualizations": return_visualizations
        }
        
        # Perform analysis
        result = model.predict(input_data)
        
        return BreastCancerAnalysisResponse(
            classification=result["classification"],
            segmentation=result.get("segmentation"),
            visualizations=result.get("visualizations"),
            analysis_metadata=result["analysis_metadata"],
            status="success"
        )
        
    except ValueError as e:
        logger.error(f"Breast cancer analysis model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Breast cancer analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/brain-tumor/analyze", response_model=BrainTumorAnalysisResponse)
def analyze_brain_tumor(request: BrainTumorAnalysisRequest):
    """Analyze brain tumor from base64 encoded MRI image"""
    try:
        # Get the brain tumor analysis model
        model = model_registry.get_model("brain_tumor_analysis")
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Brain tumor analysis model is not available"
            )
        
        # Prepare input data
        input_data = {
            "image_data": request.image_data,
            "detailed_analysis": request.detailed_analysis,
            "return_visualizations": request.return_visualizations
        }
        
        # Perform analysis
        result = model.predict(input_data)
        
        return BrainTumorAnalysisResponse(
            classification=result["classification"],
            medical_info=result.get("medical_info"),
            visualizations=result.get("visualizations"),
            analysis_metadata=result["analysis_metadata"],
            status="success"
        )
        
    except ValueError as e:
        logger.error(f"Brain tumor analysis model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Brain tumor analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/brain-tumor/analyze-upload")
async def analyze_brain_tumor_upload(
    image: UploadFile = File(..., description="Brain MRI image to analyze")
):
    """Analyze brain tumor from uploaded MRI image file and return detailed visualization"""
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Get the brain tumor analysis model
        model = model_registry.get_model("brain_tumor_analysis")
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Brain tumor analysis model is not available"
            )
        
        # Load and analyze the image
        from PIL import Image
        original_image = Image.open(BytesIO(image_data))
        
        # Perform classification
        image_tensor = model.preprocess_image(original_image)
        predicted_class, confidence, class_probabilities = model.classify_image(image_tensor)
        
        # Create detailed visualization
        detailed_viz = model.create_detailed_visualization(
            original_image, predicted_class, confidence, class_probabilities
        )
        
        # Convert visualization to bytes for response
        img_buffer = BytesIO()
        detailed_viz.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Determine tumor status for headers
        tumor_detected = predicted_class != "notumor"
        risk_level = model._get_risk_level(predicted_class, confidence)
        
        return StreamingResponse(
            img_buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=brain_tumor_analysis_{predicted_class}.png",
                "X-Analysis-Result": f"Class: {predicted_class}, Confidence: {confidence:.2%}",
                "X-Risk-Level": risk_level,
                "X-Tumor-Detected": str(tumor_detected),
                "X-Tumor-Type": predicted_class if tumor_detected else "none"
            }
        )
        
    except ValueError as e:
        logger.error(f"Brain tumor analysis model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Brain tumor analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/oncology/analyze", response_model=OncologyAnalysisResponse)
def analyze_oncology(request: OncologyAnalysisRequest):
    """Analyze lung and colon cancer from base64 encoded histopathological image"""
    try:
        # Get the oncology analysis model
        model = model_registry.get_model("oncology_analysis")
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Oncology analysis model is not available"
            )
        
        # Prepare input data
        input_data = {
            "image_data": request.image_data,
            "detailed_analysis": request.detailed_analysis,
            "return_visualizations": request.return_visualizations
        }
        
        # Perform analysis
        result = model.predict(input_data)
        
        return OncologyAnalysisResponse(
            classification=result["classification"],
            medical_info=result.get("medical_info"),
            visualizations=result.get("visualizations"),
            analysis_metadata=result["analysis_metadata"],
            status="success"
        )
        
    except ValueError as e:
        logger.error(f"Oncology analysis model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Oncology analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/oncology/analyze-upload")
async def analyze_oncology_upload(
    image: UploadFile = File(..., description="Histopathological image to analyze")
):
    """Analyze lung and colon cancer from uploaded histopathological image file and return detailed visualization"""
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an image file."
            )
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Get the oncology analysis model
        model = model_registry.get_model("oncology_analysis")
        
        # Check if model is healthy
        if not model.is_healthy():
            raise HTTPException(
                status_code=503, 
                detail="Oncology analysis model is not available"
            )
        
        # Load and analyze the image
        from PIL import Image
        original_image = Image.open(BytesIO(image_data))
        
        # Perform classification
        image_tensor = model.preprocess_image(original_image)
        predicted_class, confidence, class_probabilities = model.classify_image(image_tensor)
        
        # Create detailed visualization
        detailed_viz = model.create_detailed_visualization(
            original_image, predicted_class, confidence, class_probabilities
        )
        
        # Convert visualization to bytes for response
        img_buffer = BytesIO()
        detailed_viz.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Determine cancer status for headers
        cancer_detected = "n" not in predicted_class.lower()
        risk_level = model._get_risk_level(predicted_class, confidence)
        tissue_type = "colon" if "colon" in predicted_class else "lung"
        
        return StreamingResponse(
            img_buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=oncology_analysis_{predicted_class}.png",
                "X-Analysis-Result": f"Class: {predicted_class}, Confidence: {confidence:.2%}",
                "X-Risk-Level": risk_level,
                "X-Cancer-Detected": str(cancer_detected),
                "X-Cancer-Type": predicted_class if cancer_detected else "none",
                "X-Tissue-Type": tissue_type
            }
        )
        
    except ValueError as e:
        logger.error(f"Oncology analysis model not found: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Oncology analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        models_status = {}
        overall_healthy = True
        
        for model_name in model_registry.models:
            model_status = model_registry.get_model_status(model_name)
            models_status[model_name] = model_status["status"]
            if model_status["status"] != "healthy":
                overall_healthy = False
        
        return {
            "status": "healthy" if overall_healthy else "degraded",
            "models": models_status,
            "message": "All models are healthy" if overall_healthy else "Some models are unhealthy"
        }
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return {
            "status": "unhealthy",
            "message": f"Health check failed: {str(e)}"
        }

if __name__ == "__main__":
    host = os.getenv("MODEL_HOST", "127.0.0.1")
    port = int(os.getenv("MODEL_PORT", 8080))
    uvicorn.run(app, host=host, port=port)