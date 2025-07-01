/**
 * Configuration utility for model API endpoints
 */

// Get the base URL for model API from environment variables
export const getModelApiBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_MODELS_API_URL || 'http://127.0.0.1:8080';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

// Helper function to construct model API URLs
export const getModelApiUrl = (endpoint: string): string => {
  const baseUrl = getModelApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Common model API endpoints
export const MODEL_API_ENDPOINTS = {
  TRANSCRIPTIONS: '/transcriptions',
  SUMMARIZE: '/summarize',
  NEUROLOGY: '/brain-tumor/analyze-upload',
  ONCOLOGY: '/oncology/analyze-upload',
  BREAST: '/breast-cancer/analyze-upload',
  HEALTH: '/health',
  MODELS: '/models'
} as const;
