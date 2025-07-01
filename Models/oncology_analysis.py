import os
import numpy as np
from PIL import Image
import logging
from typing import Dict, Any, Tuple, List
from io import BytesIO
import base64

# Try importing TensorFlow, handle gracefully if not available
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    from tensorflow.keras.preprocessing import image
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    tf = None
    load_model = None

from base_model import BaseModelService

logger = logging.getLogger(__name__)

class OncologyAnalysisService(BaseModelService):
    """Service for lung and colon cancer classification from histopathological images"""
    
    def __init__(self):
        super().__init__()
        self.model_name = "Oncology Analysis"
        self.description = "DenseNet121-based model for lung and colon cancer classification from histopathological images"
        
        # Model configurations based on the notebook
        self.CLASSES = ['colon_aca', 'colon_n', 'lung_aca', 'lung_n', 'lung_scc']
        self.CLASS_DESCRIPTIONS = {
            'colon_aca': 'Colon Adenocarcinoma',
            'colon_n': 'Normal Colon Tissue', 
            'lung_aca': 'Lung Adenocarcinoma',
            'lung_n': 'Normal Lung Tissue',
            'lung_scc': 'Lung Squamous Cell Carcinoma'
        }
        self.IMAGE_SIZE = 224
        
        # Model path
        self.model_path = os.path.join(os.path.dirname(__file__), 'oncology', 'densenet121_lung_colon_model.h5')
        
        # Model
        self.model = None
        
        # Load model
        self.load_model()
    
    def load_model(self) -> bool:
        """Load the oncology classification model"""
        try:
            if not TENSORFLOW_AVAILABLE:
                logger.error("TensorFlow is not available. Please install TensorFlow to use oncology analysis.")
                return False
            
            # Load the DenseNet121 model
            if os.path.exists(self.model_path):
                try:
                    self.model = load_model(self.model_path)
                    logger.info("DenseNet121 oncology model loaded successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error loading oncology model: {e}")
                    return False
            else:
                logger.error(f"Oncology model not found at {self.model_path}")
                return False
            
        except Exception as e:
            logger.error(f"Error loading oncology model: {str(e)}")
            return False
    
    def is_healthy(self) -> bool:
        """Check if the model is loaded and healthy"""
        return (self.model is not None and TENSORFLOW_AVAILABLE)
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for oncology classification"""
        # Convert to RGB if needed
        image_rgb = image.convert("RGB")
        
        # Resize to model input size
        image_resized = image_rgb.resize((self.IMAGE_SIZE, self.IMAGE_SIZE))
        
        # Convert to numpy array
        img_array = np.array(image_resized)
        
        # Normalize pixel values to [0, 1] as done in training
        img_array = img_array / 255.0
        
        # Expand dimensions to create batch
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    
    def classify_image(self, image_tensor: np.ndarray) -> Tuple[str, float, Dict[str, float]]:
        """Perform classification on the image"""
        if not TENSORFLOW_AVAILABLE or self.model is None:
            raise Exception("Model is not available")
        
        # Make prediction
        predictions = self.model.predict(image_tensor, verbose=0)
        predicted_index = np.argmax(predictions[0])
        predicted_class = self.CLASSES[predicted_index]
        confidence = float(np.max(predictions[0]))
        
        # Get all class probabilities
        all_probabilities = predictions[0]
        class_probabilities = {
            self.CLASSES[i]: float(all_probabilities[i]) 
            for i in range(len(self.CLASSES))
        }
        
        return predicted_class, confidence, class_probabilities
    
    def create_visualization(self, original_image: Image.Image, predicted_class: str, confidence: float) -> Image.Image:
        """Create visualization with classification results"""
        from PIL import ImageDraw, ImageFont
        
        # Create a copy of the original image
        result_image = original_image.copy()
        draw = ImageDraw.Draw(result_image)
        
        # Determine colors and status based on classification
        is_cancer = "n" not in predicted_class.lower()
        
        if is_cancer:
            color = (255, 0, 0)  # Red for cancer detected
            status = f"CANCER DETECTED: {self.CLASS_DESCRIPTIONS[predicted_class]}"
        else:
            color = (0, 128, 0)  # Green for normal tissue
            status = f"NORMAL TISSUE: {self.CLASS_DESCRIPTIONS[predicted_class]}"
        
        try:
            # Try to use a larger font
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
            subtitle_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
        except:
            # Fallback to default font
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
        
        # Add text with background for better visibility
        main_text = status
        confidence_text = f"Confidence: {confidence:.1%}"
        
        # Calculate text dimensions and position
        try:
            main_bbox = draw.textbbox((0, 0), main_text, font=title_font)
            conf_bbox = draw.textbbox((0, 0), confidence_text, font=subtitle_font)
            
            main_width = main_bbox[2] - main_bbox[0]
            main_height = main_bbox[3] - main_bbox[1]
            conf_width = conf_bbox[2] - conf_bbox[0]
            conf_height = conf_bbox[3] - conf_bbox[1]
        except:
            # Fallback for older PIL versions
            main_width = len(main_text) * 12
            main_height = 24
            conf_width = len(confidence_text) * 10
            conf_height = 18
        
        # Position at top of image
        x_pos = 10
        y_pos = 10
        padding = 10
        
        # Calculate background rectangle size
        bg_width = max(main_width, conf_width) + (padding * 2)
        bg_height = main_height + conf_height + (padding * 3)
        
        # Draw semi-transparent background
        draw.rectangle([
            (x_pos - padding, y_pos - padding),
            (x_pos + bg_width, y_pos + bg_height)
        ], fill=(0, 0, 0, 180))
        
        # Draw text
        draw.text((x_pos, y_pos), main_text, fill=color, font=title_font)
        draw.text((x_pos, y_pos + main_height + padding), confidence_text, fill=(255, 255, 255), font=subtitle_font)
        
        return result_image
    
    def create_detailed_visualization(self, original_image: Image.Image, predicted_class: str, confidence: float, class_probabilities: Dict[str, float]) -> Image.Image:
        """Create detailed visualization with all class probabilities"""
        from PIL import ImageDraw, ImageFont
        
        # Get original image dimensions
        orig_width, orig_height = original_image.size
        
        # Create a wider image to accommodate the probability chart
        total_width = orig_width + 400  # Extra space for probability bars
        total_height = max(orig_height, 500)  # Ensure minimum height
        
        # Create new image with white background
        composite = Image.new('RGB', (total_width, total_height), color='white')
        
        # Paste original image on the left
        composite.paste(original_image, (0, 0))
        
        draw = ImageDraw.Draw(composite)
        
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
            text_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 10)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
        
        # Add title
        title = "Oncology Analysis - Lung & Colon Cancer"
        draw.text((orig_width + 10, 10), title, fill=(0, 0, 0), font=title_font)
        
        # Add main prediction
        is_cancer = "n" not in predicted_class.lower()
        main_text = f"Prediction: {self.CLASS_DESCRIPTIONS[predicted_class]}"
        confidence_text = f"Confidence: {confidence:.1%}"
        
        prediction_color = (255, 0, 0) if is_cancer else (0, 128, 0)
        draw.text((orig_width + 10, 40), main_text, fill=prediction_color, font=text_font)
        draw.text((orig_width + 10, 60), confidence_text, fill=(0, 0, 0), font=text_font)
        
        # Add cancer status
        status_text = "🚨 CANCER DETECTED" if is_cancer else "✅ NORMAL TISSUE"
        draw.text((orig_width + 10, 85), status_text, fill=prediction_color, font=text_font)
        
        # Add probability bars
        draw.text((orig_width + 10, 120), "Class Probabilities:", fill=(0, 0, 0), font=text_font)
        
        y_start = 150
        bar_height = 25
        bar_spacing = 35
        max_bar_width = 300
        
        # Sort probabilities for better display
        sorted_probs = sorted(class_probabilities.items(), key=lambda x: x[1], reverse=True)
        
        for i, (class_name, prob) in enumerate(sorted_probs):
            y_pos = y_start + i * bar_spacing
            
            # Draw class name with description
            class_desc = self.CLASS_DESCRIPTIONS[class_name]
            draw.text((orig_width + 10, y_pos), f"{class_desc}:", fill=(0, 0, 0), font=small_font)
            
            # Draw probability bar
            bar_width = int(prob * max_bar_width)
            
            # Color coding: red for cancer types, green for normal
            if "n" in class_name:  # Normal tissue
                bar_color = (0, 128, 0)
            else:  # Cancer types
                bar_color = (255, 0, 0) if class_name == predicted_class else (255, 128, 128)
            
            draw.rectangle([
                (orig_width + 10, y_pos + 15),
                (orig_width + 10 + bar_width, y_pos + bar_height + 10)
            ], fill=bar_color)
            
            # Draw percentage
            draw.text((orig_width + 10 + max_bar_width + 10, y_pos + 15), f"{prob:.1%}", fill=(0, 0, 0), font=small_font)
        
        # Add medical information section
        medical_y = y_start + len(sorted_probs) * bar_spacing + 30
        draw.text((orig_width + 10, medical_y), "Medical Information:", fill=(0, 0, 0), font=text_font)
        
        medical_info = self._get_medical_info(predicted_class)
        for j, (key, value) in enumerate(medical_info.items()):
            if key != "description":  # Skip description as it's shown above
                info_y = medical_y + 25 + j * 20
                draw.text((orig_width + 10, info_y), f"{key.title()}: {value}", fill=(0, 0, 0), font=small_font)
        
        return composite
    
    def _get_risk_level(self, predicted_class: str, confidence: float) -> str:
        """Determine risk level based on classification results"""
        is_cancer = "n" not in predicted_class.lower()
        
        if not is_cancer:
            return "NO_RISK" if confidence > 0.8 else "LOW_RISK"
        else:
            # Cancer detected
            if confidence > 0.9:
                return "HIGH_CONFIDENCE"
            elif confidence > 0.7:
                return "MODERATE_CONFIDENCE"
            else:
                return "LOW_CONFIDENCE"
    
    def _get_medical_info(self, predicted_class: str) -> Dict[str, str]:
        """Get medical information about the classification"""
        info_map = {
            "colon_aca": {
                "description": "Colon adenocarcinoma - a type of cancer that begins in mucus-making cells in the colon",
                "urgency": "Requires immediate oncological evaluation",
                "tissue_type": "Colon tissue",
                "cancer_type": "Adenocarcinoma"
            },
            "colon_n": {
                "description": "Normal colon tissue - healthy colonic epithelium",
                "urgency": "Normal findings",
                "tissue_type": "Colon tissue",
                "cancer_type": "None detected"
            },
            "lung_aca": {
                "description": "Lung adenocarcinoma - the most common type of lung cancer",
                "urgency": "Requires immediate oncological evaluation",
                "tissue_type": "Lung tissue",
                "cancer_type": "Adenocarcinoma"
            },
            "lung_n": {
                "description": "Normal lung tissue - healthy pulmonary epithelium",
                "urgency": "Normal findings",
                "tissue_type": "Lung tissue", 
                "cancer_type": "None detected"
            },
            "lung_scc": {
                "description": "Lung squamous cell carcinoma - a type of non-small cell lung cancer",
                "urgency": "Requires immediate oncological evaluation",
                "tissue_type": "Lung tissue",
                "cancer_type": "Squamous cell carcinoma"
            }
        }
        
        return info_map.get(predicted_class, {
            "description": "Unknown classification",
            "urgency": "Requires medical evaluation",
            "tissue_type": "Unknown",
            "cancer_type": "Unknown"
        })
    
    def image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string"""
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return img_str
    
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform oncology analysis on uploaded histopathological image
        
        Expected input_data format:
        {
            "image_data": bytes,  # Raw image bytes
            "detailed_analysis": bool,  # Whether to include detailed medical info
            "return_visualizations": bool  # Whether to return base64 encoded visualizations
        }
        """
        try:
            if not self.is_healthy():
                raise Exception("Oncology analysis model is not loaded")
            
            # Extract parameters
            image_data = input_data.get("image_data")
            detailed_analysis = input_data.get("detailed_analysis", True)
            return_visualizations = input_data.get("return_visualizations", True)
            
            if not image_data:
                raise ValueError("No image data provided")
            
            # Load and process image
            if isinstance(image_data, str):
                # If base64 string, decode it
                image_data = base64.b64decode(image_data)
            
            image = Image.open(BytesIO(image_data))
            original_size = image.size
            
            # Perform classification
            image_tensor = self.preprocess_image(image)
            predicted_class, confidence, class_probabilities = self.classify_image(image_tensor)
            
            # Determine cancer status
            is_cancer = "n" not in predicted_class.lower()
            
            # Prepare result
            result = {
                "classification": {
                    "predicted_class": predicted_class,
                    "predicted_class_description": self.CLASS_DESCRIPTIONS[predicted_class],
                    "confidence": confidence,
                    "class_probabilities": class_probabilities,
                    "risk_level": self._get_risk_level(predicted_class, confidence),
                    "cancer_detected": is_cancer,
                    "tissue_type": "colon" if "colon" in predicted_class else "lung"
                },
                "analysis_metadata": {
                    "image_size": original_size,
                    "model_version": "DenseNet121_Oncology",
                    "classes": self.CLASSES,
                    "model_type": "histopathological_classification"
                }
            }
            
            # Add detailed medical information if requested
            if detailed_analysis:
                medical_info = self._get_medical_info(predicted_class)
                result["medical_info"] = medical_info
            
            # Add visualizations if requested
            if return_visualizations:
                # Create simple visualization
                simple_viz = self.create_visualization(image, predicted_class, confidence)
                
                # Create detailed visualization
                detailed_viz = self.create_detailed_visualization(image, predicted_class, confidence, class_probabilities)
                
                result["visualizations"] = {
                    "original_image": self.image_to_base64(image),
                    "simple_visualization": self.image_to_base64(simple_viz),
                    "detailed_visualization": self.image_to_base64(detailed_viz)
                }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in oncology analysis: {str(e)}")
            raise Exception(f"Analysis failed: {str(e)}")
    
    def analyze_from_file(self, image_file) -> Dict[str, Any]:
        """
        Analyze oncology from uploaded file (for FastAPI UploadFile)
        """
        try:
            # Read file content
            if hasattr(image_file, 'read'):
                image_data = image_file.read()
            else:
                # Assume it's already bytes
                image_data = image_file
            
            # Prepare input data
            input_data = {
                "image_data": image_data,
                "detailed_analysis": True,
                "return_visualizations": True
            }
            
            return self.predict(input_data)
            
        except Exception as e:
            logger.error(f"Error analyzing file: {str(e)}")
            raise Exception(f"File analysis failed: {str(e)}")
