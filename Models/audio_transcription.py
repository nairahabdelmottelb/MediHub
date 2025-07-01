import os
import io
import logging
from typing import Dict, Any, Optional
from fastapi import UploadFile
from google.cloud import speech
from google.oauth2 import service_account
from pydub import AudioSegment

from base_model import BaseModelService

class AudioTranscriptionService(BaseModelService):
    """Audio transcription service using Google Cloud Speech-to-Text API"""
    
    def __init__(self):
        super().__init__()
        self.model_name = "audio_transcription"
        self.description = "Google Cloud Speech-to-Text API transcription service"
        # Initialize attributes first
        self.transcription_client = None
        self.model = None
        self.sampling_rate = 16000
        self.channels = 1
        self.language_code = "en-US"
        
        # Try to load the model
        success = self.load_model()
        if not success:
            logging.warning(f"Failed to load {self.model_name} model")
        else:
            logging.info(f"Successfully loaded {self.model_name} model")
        
    def load_model(self) -> bool:
        """Load the Google Cloud Speech-to-Text client"""
        try:
            # Use simple relative path that works
            credentials_path = "Transcription/cred.json"
            
            if not os.path.exists(credentials_path):
                logging.error(f"Credentials file not found at {credentials_path}")
                return False
            
            # Load credentials and create client
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            self.transcription_client = speech.SpeechClient(credentials=credentials)
            
            # Set self.model to indicate the model is loaded (required by base class)
            self.model = self.transcription_client
            
            logging.info("Google Cloud Speech-to-Text client loaded successfully")
            return True
            
        except Exception as e:
            logging.error(f"Error loading Google Cloud Speech-to-Text client: {str(e)}")
            # Ensure attributes are set even on failure
            self.transcription_client = None
            self.model = None
            return False
    
    
    def format_audio(self, audio_data: bytes) -> bytes:
        """Format audio data for Google Speech-to-Text API"""
        try:
            # Convert audio to AudioSegment
            audio_buffer = io.BytesIO(audio_data)
            
            # Try different formats
            try:
                audio = AudioSegment.from_file(audio_buffer, format="mp3")
            except:
                try:
                    audio_buffer.seek(0)
                    audio = AudioSegment.from_file(audio_buffer, format="mp4")
                except:
                    audio_buffer.seek(0)
                    audio = AudioSegment.from_file(audio_buffer, format="wav")
            
            logging.info(f"Audio length (ms): {len(audio)}, Frame rate: {audio.frame_rate}")
            
            # Convert to required format for Google API
            audio = audio.set_channels(self.channels)
            audio = audio.set_frame_rate(self.sampling_rate)
            
            # Export as 16-bit PCM WAV
            output_buffer = io.BytesIO()
            audio.export(output_buffer, format="wav", parameters=["-acodec", "pcm_s16le"])
            output_buffer.seek(0)
            
            audio_content = output_buffer.read()
            logging.info(f"Formatted audio size: {len(audio_content)} bytes")
            
            return audio_content
            
        except Exception as e:
            logging.error(f"Error formatting audio: {str(e)}")
            raise

    def predict(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transcribe audio data using Google Cloud Speech-to-Text"""
        try:
            if not self.transcription_client:
                raise Exception("Transcription client not initialized")
            
            # Extract parameters
            audio_data = input_data.get("audio_data")
            model_type = input_data.get("model_type", "")
            
            if not audio_data:
                raise ValueError("audio_data is required")
            
            # Format audio
            formatted_audio = self.format_audio(audio_data)
            
            # Create recognition request
            audio = speech.RecognitionAudio(content=formatted_audio)
            
            # Configure recognition settings
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=self.sampling_rate,
                language_code=self.language_code,
                use_enhanced=True,
                model=model_type if model_type in ["medical_conversation", "medical_dictation"] else "default"
            )
            
            # Perform transcription
            response = self.transcription_client.recognize(config=config, audio=audio)
            
            # Extract transcription
            transcription = ""
            confidence = 0.0
            
            for result in response.results:
                alternative = result.alternatives[0]
                transcription += alternative.transcript + " "
                confidence = max(confidence, alternative.confidence)
            
            return {
                "transcription": transcription.strip(),
                "confidence": confidence,
                "model_type": model_type or "default",
                "language": self.language_code
            }
            
        except Exception as e:
            logging.error(f"Transcription error: {str(e)}")
            raise Exception(f"Transcription failed: {str(e)}")

    def transcribe_file(self, file: UploadFile) -> Dict[str, Any]:
        """Transcribe uploaded audio file"""
        try:
            if not self.transcription_client:
                raise Exception("Transcription client not initialized")
            
            # Read file content
            audio_data = file.file.read()
            
            if len(audio_data) == 0:
                raise ValueError("Empty audio file")
            
            # Format audio
            formatted_audio = self.format_audio(audio_data)
            
            # Create recognition request
            audio = speech.RecognitionAudio(content=formatted_audio)
            
            # Configure recognition settings
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=self.sampling_rate,
                language_code=self.language_code,
                use_enhanced=True,
                enable_automatic_punctuation=True,
                model="medical_conversation"  # Use medical model for healthcare context
            )
            
            # Perform transcription
            response = self.transcription_client.recognize(config=config, audio=audio)
            
            # Extract transcription
            transcription = ""
            confidence = 0.0
            
            for result in response.results:
                alternative = result.alternatives[0]
                transcription += alternative.transcript + " "
                confidence = max(confidence, alternative.confidence)
            
            return {
                "transcription": transcription.strip(),
                "confidence": confidence,
                "language": self.language_code,
                "filename": file.filename or "unknown",
                "status": "completed"
            }
            
        except Exception as e:
            logging.error(f"File transcription error: {str(e)}")
            raise Exception(f"File transcription failed: {str(e)}")
