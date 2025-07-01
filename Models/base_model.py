
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseModelService(ABC):
    """Base class for ML model services"""
    
    def __init__(self):
        self.model = None
        self.model_name = "Base Model"
        self.description = "Base model service"
    
    @abstractmethod
    def load_model(self) -> bool:
        """Load the ML model - must be implemented by subclasses
        Returns True if successful, False otherwise"""
        pass
    
    @abstractmethod
    def predict(self, input_data: Any) -> Dict[str, Any]:
        """Make predictions using the model - must be implemented by subclasses"""
        pass
    
    def is_healthy(self) -> bool:
        """Check if the model service is healthy"""
        return self.is_model_loaded()
    
    def is_model_loaded(self) -> bool:
        """Check if the model is loaded"""
        return self.model is not None
    
    def get_model_info(self) -> Dict[str, str]:
        """Get basic information about the model"""
        return {
            "model_name": self.model_name,
            "description": self.description,
            "status": "loaded" if self.is_model_loaded() else "not_loaded"
        }
