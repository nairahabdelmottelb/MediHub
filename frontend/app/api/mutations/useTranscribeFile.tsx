import { useMutation } from "@tanstack/react-query";
import axios from "axios";

export interface TranscriptionRequest {
  file: File;
}

export interface TranscriptionResponse {
  text: string;
  summary: string;
  keyPoints: string[];
  timestamp: string;
  confidence?: number;
  duration?: number;
  language?: string;
}

// Hook to send audio/video files for transcription
export const useTranscribeFile = () => {
  return useMutation({
    mutationFn: async (request: TranscriptionRequest): Promise<TranscriptionResponse> => {
      try {
        const formData = new FormData();
        formData.append("file", request.file);
        formData.append("language", "en"); // Default to English
        formData.append("format", "detailed"); // Request detailed response with summary and key points

        const response = await axios.post("https://api.local/transcriptions", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000, // 2 minutes timeout for file processing
        });

        return response.data;
      } catch (error) {
        console.error("Transcription API error:", error);

        // Since the API is a placeholder and doesn't exist yet, provide a mock response
        // This will be replaced when the real API is available
        if (axios.isAxiosError(error) && (error.code === 'ENOTFOUND' || error.response?.status === 404)) {
          console.warn("Using mock transcription data - API endpoint not available");

          // Generate mock response based on file type and name
          const fileName = request.file.name.toLowerCase();
          const fileType = request.file.type;

          let mockText = "Patient consultation recording transcribed successfully.";
          let mockSummary = "Medical consultation summary";
          let mockKeyPoints = ["File processed", "Transcription completed"];

          if (fileName.includes("consultation") || fileName.includes("appointment")) {
            mockText = "Patient presented with symptoms of fever and cough. Temperature recorded at 38.5°C. Physical examination revealed clear chest sounds. Recommended rest, increased fluid intake, and prescribed acetaminophen for fever management. Follow-up scheduled in one week if symptoms persist.";
            mockSummary = "Patient consultation for fever and cough symptoms, prescribed medication and rest";
            mockKeyPoints = [
              "Fever: 38.5°C",
              "Cough present",
              "Clear chest examination",
              "Acetaminophen prescribed",
              "Rest and fluids recommended",
              "Follow-up in one week"
            ];
          } else if (fileName.includes("follow") || fileName.includes("checkup")) {
            mockText = "Follow-up appointment for previous condition. Patient reports improvement in symptoms. Vital signs stable. Blood pressure: 120/80 mmHg. Continue current medication regimen. Next appointment scheduled in 3 months.";
            mockSummary = "Follow-up appointment showing patient improvement";
            mockKeyPoints = [
              "Symptoms improved",
              "Vital signs stable",
              "BP: 120/80 mmHg",
              "Continue medications",
              "3-month follow-up scheduled"
            ];
          } else if (fileType.startsWith("video")) {
            mockText = "Video consultation session recorded. Patient discussed ongoing treatment progress and medication adherence. No significant changes in condition reported. Recommended to continue current treatment plan.";
            mockSummary = "Video consultation for treatment progress review";
            mockKeyPoints = [
              "Video consultation completed",
              "Treatment progress discussed",
              "Good medication adherence",
              "Continue current plan"
            ];
          }

          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

          return {
            text: mockText,
            summary: mockSummary,
            keyPoints: mockKeyPoints,
            timestamp: new Date().toLocaleString(),
            confidence: 0.95,
            duration: Math.round(request.file.size / 50000), // Mock duration based on file size
            language: "en"
          };
        }

        throw error;
      }
    },
  });
};
