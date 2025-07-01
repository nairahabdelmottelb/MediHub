
"""
Text Summarization Service
This module provides text summarization functionality using Hugging Face's DistilBART model.
"""

from pydantic import BaseModel
from transformers import pipeline
import torch
import logging
from base_model import BaseModelService

# Configure logging to suppress transformer warnings
logging.getLogger("transformers").setLevel(logging.ERROR)

class TextToSummarize(BaseModel):
    text: str
    max_length: int = 150  # Default value that users can modify
    min_length: int = 30   # Default value that users can modify

class TextSummarizationService(BaseModelService):
    def __init__(self):
        super().__init__()
        self.model_name = "DistilBART Text Summarization"
        self.description = "AI-powered text summarization using DistilBART model for medical notes and documents"
        self.load_model()
    
    def load_model(self):
        """Load the text summarization model"""
        try:
            self.model = pipeline(
                "summarization", 
                model="sshleifer/distilbart-cnn-12-6", 
                torch_dtype=torch.bfloat16
            )
            print("Text summarization model loaded successfully!")
            return True
        except Exception as e:
            print(f"Error loading text summarization model: {e}")
            self.model = None
            return False
    
    def predict(self, input_data) -> dict:
        """
        Predict method for base class compatibility.
        For text summarization, this wraps the summarize method.
        """
        if isinstance(input_data, dict):
            request = TextToSummarize(**input_data)
        else:
            request = input_data
        return self.summarize(request)
    
    def summarize(self, request: TextToSummarize) -> dict:
        """
        Summarize the given text.
        
        Args:
            request: TextToSummarize object containing text and parameters
            
        Returns:
            Dictionary containing the summary or error message
        """
        if self.model is None:
            return {"error": "Text summarization model is not loaded. Please check the server logs."}
        
        try:
            output = self.model(
                request.text, 
                max_length=request.max_length, 
                min_length=request.min_length
            )
            
            summary = output[0]['summary_text']
            return {"summary": summary}
            
        except Exception as e:
            return {"error": f"Error during text summarization: {str(e)}"}

# Global instance
text_summarization_service = TextSummarizationService()
