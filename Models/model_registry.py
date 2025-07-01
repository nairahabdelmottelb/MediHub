import logging
from typing import Dict
from base_model import BaseModelService
from text_summarization import TextSummarizationService
from audio_transcription import AudioTranscriptionService
from breast_cancer_analysis import BreastCancerAnalysisService
from brain_tumor_analysis import BrainTumorAnalysisService
from oncology_analysis import OncologyAnalysisService

logger = logging.getLogger(__name__)

class ModelRegistry:
    """Registry to manage all ML models"""
    
    def __init__(self):
        self.models: Dict[str, BaseModelService] = {}
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize and register all available models"""
        try:
            # Text Summarization
            text_summarization = TextSummarizationService()
            # Model is already loaded in constructor, just register it
            self.models["text_summarization"] = text_summarization
            logger.info("Text summarization model registered successfully")
            
            # Audio Transcription
            audio_transcription = AudioTranscriptionService()
            self.models["audio_transcription"] = audio_transcription
            logger.info("Audio transcription model registered successfully")
            
            # Breast Cancer Analysis
            breast_cancer_analysis = BreastCancerAnalysisService()
            self.models["breast_cancer_analysis"] = breast_cancer_analysis
            logger.info("Breast cancer analysis model registered successfully")
            
            # Brain Tumor Analysis
            brain_tumor_analysis = BrainTumorAnalysisService()
            self.models["brain_tumor_analysis"] = brain_tumor_analysis
            logger.info("Brain tumor analysis model registered successfully")
            
            # Oncology Analysis
            oncology_analysis = OncologyAnalysisService()
            self.models["oncology_analysis"] = oncology_analysis
            logger.info("Oncology analysis model registered successfully")
                
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
    
    def get_model(self, model_name: str) -> BaseModelService:
        """Get a model by name"""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not found")
        return self.models[model_name]
    
    def list_models(self) -> Dict[str, Dict]:
        """List all available models and their status"""
        return {
            name: {
                "description": model.description,
                "status": "healthy" if model.is_healthy() else "unhealthy"
            }
            for name, model in self.models.items()
        }
    
    def get_model_status(self, model_name: str) -> Dict:
        """Get status of a specific model"""
        if model_name not in self.models:
            return {"status": "not_found"}
        
        model = self.models[model_name]
        return {
            "name": model_name,
            "description": model.description,
            "status": "healthy" if model.is_healthy() else "unhealthy"
        }

# Global model registry instance
model_registry = ModelRegistry()
