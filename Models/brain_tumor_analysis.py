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

class BrainTumorAnalysisService(BaseModelService):
    """Service for brain tumor classification from MRI images"""
    
    def __init__(self):
        super().__init__()
        self.model_name = "Brain Tumor Analysis"
        self.description = "ResNet50-based model for brain tumor classification from MRI images"
        
        # Model configurations
        self.CLASSES = ['glioma', 'meningioma', 'notumor', 'pituitary']
        self.IMAGE_SIZE = 224
        
        # Model path
        self.model_path = os.path.join(os.path.dirname(__file__), 'brain-tumor', 'RN50_model.h5')
        
        # Model
        self.model = None
        
        # Load model
        self.load_model()
    
    def load_model(self) -> bool:
        """Load the brain tumor classification model"""
        try:
            if not TENSORFLOW_AVAILABLE:
                logger.error("TensorFlow is not available. Please install TensorFlow to use brain tumor analysis.")
                return False
            
            # Load the ResNet50 model
            if os.path.exists(self.model_path):
                # Load with custom objects if needed for swish activation
                try:
                    self.model = load_model(self.model_path)
                    logger.info("ResNet50 brain tumor model loaded successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error loading model with default loader: {e}")
                    # Try loading with custom objects
                    try:
                        custom_objects = {'swish': tf.keras.activations.swish}
                        self.model = load_model(self.model_path, custom_objects=custom_objects)
                        logger.info("ResNet50 brain tumor model loaded successfully with custom objects")
                        return True
                    except Exception as e2:
                        logger.error(f"Error loading model with custom objects: {e2}")
                        return False
            else:
                logger.error(f"Brain tumor model not found at {self.model_path}")
                return False
            
        except Exception as e:
            logger.error(f"Error loading brain tumor model: {str(e)}")
            return False
    
    def is_healthy(self) -> bool:
        """Check if the model is loaded and healthy"""
        return (self.model is not None and TENSORFLOW_AVAILABLE)
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for brain tumor classification"""
        # Convert to RGB if needed
        image_rgb = image.convert("RGB")
        
        # Resize to model input size
        image_resized = image_rgb.resize((self.IMAGE_SIZE, self.IMAGE_SIZE))
        
        # Convert to numpy array
        img_array = np.array(image_resized)
        
        # Expand dimensions to create batch
        img_array = np.expand_dims(img_array, axis=0)
        
        # Important: Do NOT rescale the image as noted in the notebook
        # The training data was not rescaled, so prediction data shouldn't be either
        
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
        
        # Determine colors based on classification
        if predicted_class == "notumor":
            color = (0, 128, 0)  # Green for no tumor
            status = "HEALTHY"
        else:
            color = (255, 0, 0)  # Red for tumor detected
            status = f"TUMOR DETECTED: {predicted_class.upper()}"
        
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
        import matplotlib.pyplot as plt
        import matplotlib.patches as patches
        
        # Get original image dimensions
        orig_width, orig_height = original_image.size
        
        # Create a wider image to accommodate the probability chart
        total_width = orig_width + 300  # Extra space for probability bars
        total_height = max(orig_height, 400)  # Ensure minimum height
        
        # Create new image with white background
        composite = Image.new('RGB', (total_width, total_height), color='white')
        
        # Paste original image on the left
        composite.paste(original_image, (0, 0))
        
        draw = ImageDraw.Draw(composite)
        
        try:
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
            text_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
        except:
            title_font = ImageFont.load_default()
            text_font = ImageFont.load_default()
        
        # Add title
        title = f"Brain Tumor Analysis"
        draw.text((orig_width + 10, 10), title, fill=(0, 0, 0), font=title_font)
        
        # Add main prediction
        main_text = f"Prediction: {predicted_class}"
        confidence_text = f"Confidence: {confidence:.1%}"
        
        draw.text((orig_width + 10, 40), main_text, fill=(255, 0, 0) if predicted_class != "notumor" else (0, 128, 0), font=text_font)
        draw.text((orig_width + 10, 60), confidence_text, fill=(0, 0, 0), font=text_font)
        
        # Add probability bars
        draw.text((orig_width + 10, 100), "Class Probabilities:", fill=(0, 0, 0), font=text_font)
        
        y_start = 130
        bar_height = 20
        bar_spacing = 30
        max_bar_width = 250
        
        # Sort probabilities for better display
        sorted_probs = sorted(class_probabilities.items(), key=lambda x: x[1], reverse=True)
        
        for i, (class_name, prob) in enumerate(sorted_probs):
            y_pos = y_start + i * bar_spacing
            
            # Draw class name
            draw.text((orig_width + 10, y_pos), f"{class_name}:", fill=(0, 0, 0), font=text_font)
            
            # Draw probability bar
            bar_width = int(prob * max_bar_width)
            bar_color = (255, 0, 0) if class_name == predicted_class and class_name != "notumor" else (0, 128, 0) if class_name == "notumor" else (128, 128, 128)
            
            draw.rectangle([
                (orig_width + 80, y_pos + 2),
                (orig_width + 80 + bar_width, y_pos + bar_height - 2)
            ], fill=bar_color)
            
            # Draw percentage
            draw.text((orig_width + 80 + max_bar_width + 10, y_pos), f"{prob:.1%}", fill=(0, 0, 0), font=text_font)
        
        return composite
    
    def _get_risk_level(self, predicted_class: str, confidence: float) -> str:
        """Determine risk level based on classification results"""
        if predicted_class == "notumor":
            return "NO_RISK" if confidence > 0.8 else "LOW_RISK"
        else:
            # Tumor detected
            if confidence > 0.9:
                return "HIGH_CONFIDENCE"
            elif confidence > 0.7:
                return "MODERATE_CONFIDENCE"
            else:
                return "LOW_CONFIDENCE"
    
    def _get_medical_info(self, predicted_class: str) -> Dict[str, str]:
        """Get medical information about the tumor type"""
        info = {
            "glioma": {
                "description": "A type of brain tumor that begins in glial cells",
                "urgency": "Requires immediate medical attention",
                "common_location": "Brain tissue (various locations)"
            },
            "meningioma": {
                "description": "A tumor that arises from the meninges (membranes surrounding brain and spinal cord)",
                "urgency": "Usually benign but requires medical evaluation",
                "common_location": "Meninges (brain and spinal cord coverings)"
            },
            "pituitary": {
                "description": "A tumor in the pituitary gland",
                "urgency": "Requires endocrinological evaluation",
                "common_location": "Pituitary gland (base of brain)"
            },
            "notumor": {
                "description": "No tumor detected in the MRI scan",
                "urgency": "Normal findings",
                "common_location": "N/A"
            }
        }
        
        return info.get(predicted_class, {
            "description": "Unknown classification",
            "urgency": "Requires medical evaluation",
            "common_location": "Unknown"
        })
    
    def image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string"""
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return img_str
    
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform brain tumor analysis on uploaded image
        
        Expected input_data format:
        {
            "image_data": bytes,  # Raw image bytes
            "detailed_analysis": bool,  # Whether to include detailed medical info
            "return_visualizations": bool  # Whether to return base64 encoded visualizations
        }
        """
        try:
            if not self.is_healthy():
                raise Exception("Brain tumor analysis model is not loaded")
            
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
            
            # Prepare result
            result = {
                "classification": {
                    "predicted_class": predicted_class,
                    "confidence": confidence,
                    "class_probabilities": class_probabilities,
                    "risk_level": self._get_risk_level(predicted_class, confidence),
                    "tumor_detected": predicted_class != "notumor"
                },
                "analysis_metadata": {
                    "image_size": original_size,
                    "model_version": "ResNet50_BrainTumor",
                    "classes": self.CLASSES
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
            logger.error(f"Error in brain tumor analysis: {str(e)}")
            raise Exception(f"Analysis failed: {str(e)}")
    
    def analyze_from_file(self, image_file) -> Dict[str, Any]:
        """
        Analyze brain tumor from uploaded file (for FastAPI UploadFile)
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
