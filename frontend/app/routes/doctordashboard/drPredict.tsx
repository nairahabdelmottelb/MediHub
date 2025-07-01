import React, { useState, useEffect } from "react";
import { useCurrentDoctor } from "~/api/queries/useCurrentDoctor";
import axios from "axios";
import { getModelApiUrl, MODEL_API_ENDPOINTS } from "~/utils/modelApiConfig";

export default function DrPredict() {
  const { data: currentDoctor, isLoading: doctorLoading } = useCurrentDoctor();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysisDetails, setAnalysisDetails] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cleanup function for image URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      if (resultImage) {
        URL.revokeObjectURL(resultImage);
      }
    };
  }, [preview, resultImage]);

  // Function to determine the correct API endpoint based on doctor's specialty
  const getApiEndpoint = (specialtyName: string): string => {
    const specialty = specialtyName.toLowerCase();

    if (specialty.includes('neurol')) {
      return getModelApiUrl(MODEL_API_ENDPOINTS.NEUROLOGY);
    } else if (specialty.includes('oncol')) {
      return getModelApiUrl(MODEL_API_ENDPOINTS.ONCOLOGY);
    } else if (specialty.includes('breast')) {
      return getModelApiUrl(MODEL_API_ENDPOINTS.BREAST);
    } else {
      // Throw error for unsupported specialties
      throw new Error(`Prediction model not available for ${specialtyName} specialty. Only Neurology, Oncology, and Breast specialties are supported.`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult("");
    setResultImage(null);
    setAnalysisDetails(null);
    setError("");
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult("");

    if (!image) {
      setError("Please upload an image.");
      return;
    }

    if (!currentDoctor) {
      setError("Doctor information not available. Please try again.");
      return;
    }

    setLoading(true);

    try {
      // Determine the correct API endpoint based on doctor's specialty
      let apiEndpoint;
      try {
        apiEndpoint = getApiEndpoint(currentDoctor.spec_name);
      } catch (endpointError: any) {
        setError(endpointError.message);
        setLoading(false);
        return;
      }

      console.log(`Making prediction request to: ${apiEndpoint} for specialty: ${currentDoctor.spec_name}`);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', image);

      // Add doctor information to the request
      formData.append('doctor_id', currentDoctor.doctor_id.toString());
      formData.append('specialty', currentDoctor.spec_name);

      // Make the API call expecting an image response
      const response = await axios.post(apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Important: expect binary data (image)
        timeout: 60000, // 60 second timeout for ML processing
      });

      console.log('Prediction response headers:', response.headers);

      // Extract analysis results from response headers
      const analysisResult = response.headers['x-analysis-result'] || '';
      const riskLevel = response.headers['x-risk-level'] || '';
      const tumorDetected = response.headers['x-tumor-detected'] || '';
      const tumorType = response.headers['x-tumor-type'] || '';

      // Create a URL for the result image
      const imageUrl = URL.createObjectURL(response.data);
      setResultImage(imageUrl);

      // Set analysis details
      setAnalysisDetails({
        analysisResult,
        riskLevel,
        tumorDetected,
        tumorType,
      });

      // Create a summary result message
      let resultMessage = `Analysis completed successfully!`;
      if (analysisResult) {
        resultMessage += `\n${analysisResult}`;
      }
      if (riskLevel) {
        resultMessage += `\nRisk Level: ${riskLevel}`;
      }
      if (tumorDetected && tumorDetected !== 'false') {
        resultMessage += `\nTumor Detected: ${tumorDetected}`;
        if (tumorType && tumorType !== 'none') {
          resultMessage += `\nTumor Type: ${tumorType}`;
        }
      }

      setResult(resultMessage);

    } catch (err: any) {
      console.error('Prediction API error:', err);

      if (err.code === 'ECONNABORTED') {
        setError("Request timed out. Please try again with a smaller image or check your connection.");
      } else if (err.response) {
        const status = err.response.status;

        if (status === 404) {
          setError(`The diagnostic model for ${currentDoctor.spec_name} is not available. Please contact system administrator.`);
        } else if (status === 503) {
          setError(`The diagnostic model for ${currentDoctor.spec_name} is not loaded or healthy. Please try again later.`);
        } else if (status >= 500) {
          setError(`Server error (${status}): The prediction service is temporarily unavailable.`);
        } else if (status === 400) {
          setError("Invalid image file. Please upload a valid medical image.");
        } else {
          const errorMessage = err.response.data?.detail || err.response.data?.error || err.response.data?.message || 'Unknown error';
          setError(`Failed to get prediction (${status}): ${errorMessage}`);
        }
      } else if (err.request) {
        setError("Cannot connect to prediction service. Please check if the diagnostic models are running and accessible.");
      } else {
        setError("Failed to get prediction. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Predictive Diagnosis</h2>

              {/* Doctor Loading State */}
              {doctorLoading && (
                <div className="text-center mb-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading doctor information...</span>
                  </div>
                  <small className="text-muted ms-2">Loading doctor information...</small>
                </div>
              )}

              {/* Doctor Specialty Display */}
              {currentDoctor && (
                <div className="alert alert-info mb-3">
                  <i className="fas fa-user-md me-2"></i>
                  <strong>Specialty:</strong> {currentDoctor.spec_name}
                  <br />
                  <small className="text-muted">
                    <i className="fas fa-robot me-1"></i>
                    {(() => {
                      try {
                        const endpoint = getApiEndpoint(currentDoctor.spec_name);
                        return `Using ${endpoint.split('/').pop()} diagnostic model`;
                      } catch {
                        return `Prediction model not available for this specialty`;
                      }
                    })()}
                  </small>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="image" className="form-label">
                    Upload Medical Image
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                {preview && (
                  <div className="mb-3 text-center">
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ maxWidth: "100%", maxHeight: 200 }}
                    />
                  </div>
                )}
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || doctorLoading || !currentDoctor}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-brain me-2"></i>
                        Get Prediction
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Analysis Results */}
              {result && (
                <div className="alert alert-success mt-3" role="alert">
                  <h6><i className="fas fa-check-circle me-2"></i>Analysis Results</h6>
                  <pre style={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>{result}</pre>
                </div>
              )}

              {/* Result Image */}
              {resultImage && (
                <div className="mt-3">
                  <h6>Detailed Analysis Visualization:</h6>
                  <div className="text-center">
                    <img
                      src={resultImage}
                      alt="Analysis Result"
                      style={{ maxWidth: "100%", height: "auto", border: "1px solid #ddd", borderRadius: "8px" }}
                    />
                  </div>

                  {/* Download Link */}
                  <div className="text-center mt-2">
                    <a
                      href={resultImage}
                      download={`analysis_result_${Date.now()}.png`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="fas fa-download me-1"></i>
                      Download Result
                    </a>
                  </div>
                </div>
              )}

              {/* Analysis Details */}
              {analysisDetails && (
                <div className="mt-3">
                  <h6>Analysis Details:</h6>
                  <div className="row">
                    {analysisDetails.analysisResult && (
                      <div className="col-12 mb-2">
                        <small className="text-muted">Classification:</small>
                        <div className="fw-bold">{analysisDetails.analysisResult}</div>
                      </div>
                    )}
                    {analysisDetails.riskLevel && (
                      <div className="col-md-6 mb-2">
                        <small className="text-muted">Risk Level:</small>
                        <div className={`fw-bold ${analysisDetails.riskLevel.includes('HIGH') ? 'text-danger' :
                            analysisDetails.riskLevel.includes('MODERATE') ? 'text-warning' :
                              'text-success'
                          }`}>
                          {analysisDetails.riskLevel}
                        </div>
                      </div>
                    )}
                    {analysisDetails.tumorDetected && (
                      <div className="col-md-6 mb-2">
                        <small className="text-muted">Tumor Status:</small>
                        <div className={`fw-bold ${analysisDetails.tumorDetected === 'true' ? 'text-danger' : 'text-success'}`}>
                          {analysisDetails.tumorDetected === 'true' ? 'Detected' : 'Not Detected'}
                        </div>
                      </div>
                    )}
                    {analysisDetails.tumorType && analysisDetails.tumorType !== 'none' && (
                      <div className="col-12 mb-2">
                        <small className="text-muted">Tumor Type:</small>
                        <div className="fw-bold text-info">{analysisDetails.tumorType}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
