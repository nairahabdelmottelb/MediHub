import os
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms
import logging
from typing import Dict, Any, Tuple
from io import BytesIO
import base64

# Try importing TensorFlow, handle gracefully if not available
try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    tf = None
    load_model = None

from base_model import BaseModelService

logger = logging.getLogger(__name__)

class BreastCancerAnalysisService(BaseModelService):
    """Service for breast cancer image classification and segmentation"""
    
    def __init__(self):
        super().__init__()
        self.model_name = "Breast Cancer Analysis"
        self.description = "Deep learning model for breast cancer classification and tumor segmentation from ultrasound images"
        
        # Model configurations
        self.CLASSES = ['benign', 'malignant', 'normal']
        self.CLS_IMAGE_SIZE = 224
        self.SEG_IMAGE_SIZE = 256
        self.DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        
        # Model paths
        self.classification_model_path = os.path.join(os.path.dirname(__file__), 'breast-cancer', 'VGG16_Overlayed.pth')
        self.segmentation_model_path = os.path.join(os.path.dirname(__file__), 'breast-cancer', 'Custom_UNet2.h5')
        
        # Models
        self.classification_model = None
        self.segmentation_model = None
        
        # Data transforms for classification
        self.data_transforms = transforms.Compose([
            transforms.Resize((self.CLS_IMAGE_SIZE, self.CLS_IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Load models
        self.load_model()
    
    def dice_coef(self, y_true, y_pred, smooth=1e-6):
        """Dice coefficient for segmentation evaluation"""
        if not TENSORFLOW_AVAILABLE:
            return 0.0
        y_true_f = tf.keras.backend.flatten(y_true)
        y_pred_f = tf.keras.backend.flatten(y_pred)
        intersection = tf.keras.backend.sum(y_true_f * y_pred_f)
        return (2. * intersection + smooth) / (tf.keras.backend.sum(y_true_f) + tf.keras.backend.sum(y_pred_f) + smooth)

    def bce_dice_loss(self, y_true, y_pred):
        """Combined Binary Cross Entropy and Dice loss"""
        if not TENSORFLOW_AVAILABLE:
            return 0.0
        bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
        dice = 1 - self.dice_coef(y_true, y_pred)
        return bce + dice
    
    def load_model(self) -> bool:
        """Load both classification and segmentation models"""
        try:
            if not TENSORFLOW_AVAILABLE:
                logger.error("TensorFlow is not available. Please install TensorFlow to use segmentation features.")
                return False
            
            # Load classification model (VGG16)
            if os.path.exists(self.classification_model_path):
                self.classification_model = models.vgg16()
                self.classification_model.classifier[6] = nn.Linear(
                    self.classification_model.classifier[6].in_features, 
                    len(self.CLASSES)
                )
                self.classification_model.load_state_dict(
                    torch.load(self.classification_model_path, map_location=self.DEVICE)
                )
                self.classification_model.to(self.DEVICE)
                self.classification_model.eval()
                logger.info("VGG16 classification model loaded successfully")
            else:
                logger.error(f"Classification model not found at {self.classification_model_path}")
                return False
            
            # Load segmentation model (Custom U-Net)
            if os.path.exists(self.segmentation_model_path):
                custom_objects = {
                    'bce_dice_loss': self.bce_dice_loss,
                    'dice_coef': self.dice_coef,
                    'binary_crossentropy': tf.keras.losses.binary_crossentropy
                }
                self.segmentation_model = load_model(
                    self.segmentation_model_path, 
                    custom_objects=custom_objects
                )
                logger.info("Custom U-Net segmentation model loaded successfully")
            else:
                logger.error(f"Segmentation model not found at {self.segmentation_model_path}")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading breast cancer models: {str(e)}")
            return False
    
    def is_healthy(self) -> bool:
        """Check if both models are loaded and healthy"""
        return (self.classification_model is not None and 
                self.segmentation_model is not None and
                TENSORFLOW_AVAILABLE)
    
    def preprocess_image_for_classification(self, image: Image.Image) -> torch.Tensor:
        """Preprocess image for classification model"""
        image_rgb = image.convert("RGB")
        image_tensor = self.data_transforms(image_rgb).unsqueeze(0).to(self.DEVICE)
        return image_tensor
    
    def preprocess_image_for_segmentation(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for segmentation model"""
        image_rgb = image.convert("RGB")
        image_resized = image_rgb.resize((self.SEG_IMAGE_SIZE, self.SEG_IMAGE_SIZE))
        image_array = np.array(image_resized) / 255.0
        image_tensor = np.expand_dims(image_array, axis=0)
        return image_tensor
    
    def classify_image(self, image_tensor: torch.Tensor) -> Tuple[str, float]:
        """Perform classification on the image"""
        with torch.no_grad():
            outputs = self.classification_model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, pred_idx = torch.max(probabilities, 1)
            predicted_class = self.CLASSES[pred_idx.item()]
            confidence_score = confidence.item()
            
            # Get all class probabilities
            all_probabilities = probabilities[0].cpu().numpy()
            class_probabilities = {
                self.CLASSES[i]: float(all_probabilities[i]) 
                for i in range(len(self.CLASSES))
            }
            
        return predicted_class, confidence_score, class_probabilities
    
    def segment_image(self, image_tensor: np.ndarray, original_size: Tuple[int, int]) -> Tuple[np.ndarray, np.ndarray]:
        """Perform segmentation on the image"""
        if not TENSORFLOW_AVAILABLE or self.segmentation_model is None:
            # Return empty mask if segmentation is not available
            empty_mask = np.zeros(original_size[::-1])  # height, width
            return empty_mask, empty_mask.astype(np.uint8)
            
        # Get prediction from segmentation model
        predicted_mask_raw = self.segmentation_model.predict(image_tensor, verbose=0)[0]
        
        # Resize mask back to original image size
        predicted_mask_resized = cv2.resize(predicted_mask_raw, original_size)
        
        # Create binary mask
        predicted_mask_binary = (predicted_mask_resized > 0.5).astype(np.uint8)
        
        return predicted_mask_resized, predicted_mask_binary
    
    def create_overlay_visualization(self, original_image: Image.Image, binary_mask: np.ndarray, predicted_class: str, confidence: float) -> Image.Image:
        """Create composite visualization with three panels like the notebook output"""
        from PIL import ImageDraw, ImageFont
        
        # Get original image dimensions
        orig_width, orig_height = original_image.size
        
        # Create three panels with the same height as original image
        panel_width = orig_width
        panel_height = orig_height
        composite_width = panel_width * 3 + 40  # 20px margin between panels
        composite_height = panel_height + 80  # Extra space for title and labels
        
        # Create composite image with white background
        composite = Image.new('RGB', (composite_width, composite_height), color='white')
        
        # Panel 1: Original image with classification text
        panel1 = original_image.convert("RGB").resize((panel_width, panel_height))
        draw1 = ImageDraw.Draw(panel1)
        
        try:
            # Try to use a larger font
            title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
            label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
        except:
            # Fallback to default font
            title_font = ImageFont.load_default()
            label_font = ImageFont.load_default()
        
        # Determine text color based on classification
        if predicted_class == "malignant":
            text_color = (255, 0, 0)  # Red
        elif predicted_class == "benign":
            text_color = (255, 165, 0)  # Orange
        else:
            text_color = (0, 128, 0)  # Green
        
        # Add classification text at the top of panel 1
        class_text = f"Classification: {predicted_class} ({confidence:.2%})"
        draw1.text((10, 10), class_text, fill=text_color, font=title_font)
        
        # Panel 2: Binary mask (white on black background)
        mask_image = Image.fromarray((binary_mask.squeeze() * 255).astype(np.uint8), mode='L')
        panel2 = mask_image.resize((panel_width, panel_height))
        
        # Panel 3: Original image with red overlay
        img_array = np.array(panel1)
        colored_mask = np.zeros_like(img_array)
        colored_mask[binary_mask.squeeze() == 1] = [255, 0, 0]  # Red color for tumor
        
        overlay_img = Image.fromarray(img_array)
        mask_overlay = Image.fromarray(colored_mask)
        panel3 = Image.blend(overlay_img, mask_overlay, alpha=0.4)
        
        # Create composite image
        composite_draw = ImageDraw.Draw(composite)
        
        # Add main title
        title_text = f"Prediction Analysis for {predicted_class}"
        try:
            title_bbox = composite_draw.textbbox((0, 0), title_text, font=title_font)
            title_width = title_bbox[2] - title_bbox[0]
        except:
            title_width = len(title_text) * 10  # Fallback estimation
        
        title_x = (composite_width - title_width) // 2
        composite_draw.text((title_x, 10), title_text, fill=(0, 0, 0), font=title_font)
        
        # Panel labels
        labels = ["Classification", "Predicted Mask", "Image with Mask Overlay"]
        label_y = 35
        
        for i, label in enumerate(labels):
            label_x = i * (panel_width + 20) + (panel_width // 2) - 50
            composite_draw.text((label_x, label_y), label, fill=(0, 0, 0), font=label_font)
        
        # Paste panels onto composite
        y_offset = 60
        composite.paste(panel1, (0, y_offset))
        composite.paste(panel2.convert('RGB'), (panel_width + 20, y_offset))
        composite.paste(panel3, (2 * (panel_width + 20), y_offset))
        
        return composite
    
    def image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string"""
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return img_str
    
    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform breast cancer analysis on uploaded image
        
        Expected input_data format:
        {
            "image_data": bytes,  # Raw image bytes
            "include_segmentation": bool,  # Whether to include segmentation results
            "return_visualizations": bool  # Whether to return base64 encoded visualizations
        }
        """
        try:
            if not self.is_healthy():
                raise Exception("Breast cancer analysis models are not loaded")
            
            # Extract parameters
            image_data = input_data.get("image_data")
            include_segmentation = input_data.get("include_segmentation", True)
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
            cls_tensor = self.preprocess_image_for_classification(image)
            predicted_class, confidence_score, class_probabilities = self.classify_image(cls_tensor)
            
            result = {
                "classification": {
                    "predicted_class": predicted_class,
                    "confidence": confidence_score,
                    "class_probabilities": class_probabilities,
                    "risk_level": self._get_risk_level(predicted_class, confidence_score)
                },
                "analysis_metadata": {
                    "image_size": original_size,
                    "model_versions": {
                        "classification": "VGG16_Overlayed",
                        "segmentation": "Custom_UNet2"
                    }
                }
            }
            
            # Perform segmentation if requested
            if include_segmentation:
                seg_tensor = self.preprocess_image_for_segmentation(image)
                mask_raw, mask_binary = self.segment_image(seg_tensor, original_size)
                
                # Calculate tumor area percentage
                tumor_area_percentage = self._calculate_tumor_area_percentage(mask_binary)
                
                result["segmentation"] = {
                    "tumor_detected": bool(np.any(mask_binary)),
                    "tumor_area_percentage": tumor_area_percentage,
                    "mask_confidence": float(np.mean(mask_raw))
                }
                
                # Add visualizations if requested
                if return_visualizations:
                    # Create overlay visualization with analysis results
                    overlay_image = self.create_overlay_visualization(image, mask_binary, predicted_class, confidence_score)
                    
                    # Convert to base64
                    mask_image = Image.fromarray((mask_binary.squeeze() * 255).astype(np.uint8), mode='L')
                    
                    result["visualizations"] = {
                        "original_image": self.image_to_base64(image),
                        "segmentation_mask": self.image_to_base64(mask_image),
                        "overlay_image": self.image_to_base64(overlay_image)
                    }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in breast cancer analysis: {str(e)}")
            raise Exception(f"Analysis failed: {str(e)}")
    
    def _get_risk_level(self, predicted_class: str, confidence: float) -> str:
        """Determine risk level based on classification results"""
        if predicted_class == "malignant":
            if confidence > 0.8:
                return "HIGH"
            elif confidence > 0.6:
                return "MODERATE-HIGH"
            else:
                return "MODERATE"
        elif predicted_class == "benign":
            if confidence > 0.8:
                return "LOW"
            else:
                return "MODERATE-LOW"
        else:  # normal
            return "VERY_LOW"
    
    def _calculate_tumor_area_percentage(self, binary_mask: np.ndarray) -> float:
        """Calculate the percentage of image area occupied by tumor"""
        total_pixels = binary_mask.size
        tumor_pixels = np.sum(binary_mask)
        return float(tumor_pixels / total_pixels * 100)
    
    def analyze_from_file(self, image_file) -> Dict[str, Any]:
        """
        Analyze breast cancer from uploaded file (for FastAPI UploadFile)
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
                "include_segmentation": True,
                "return_visualizations": True
            }
            
            return self.predict(input_data)
            
        except Exception as e:
            logger.error(f"Error analyzing file: {str(e)}")
            raise Exception(f"File analysis failed: {str(e)}")
