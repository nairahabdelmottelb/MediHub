import React, { useState } from "react";
import { useCurrentDoctor } from "~/api/queries/useCurrentDoctor";
import axios from "axios";

export default function DrPredict() {
  const { data: currentDoctor, isLoading: doctorLoading } = useCurrentDoctor();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Function to determine the correct API endpoint based on doctor's specialty
  const getApiEndpoint = (specialtyName: string): string => {
    const specialty = specialtyName.toLowerCase();

    if (specialty.includes('neurol')) {
      return 'https://api.local/neurology';
    } else if (specialty.includes('oncol')) {
      return 'https://api.local/oncology';
    } else if (specialty.includes('breast')) {
      return 'https://api.local/breast';
    } else {
      // Throw error for unsupported specialties
      throw new Error(`Prediction model not available for ${specialtyName} specialty. Only Neurology, Oncology, and Breast specialties are supported.`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult("");
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
      
      // Make the API call
      const response = await axios.post(apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });
      
      console.log('Prediction response:', response.data);
      
      // Handle the response
      if (response.data && response.data.prediction) {
        setResult(`Predicted diagnosis: ${response.data.prediction}`);
      } else if (response.data && response.data.result) {
        setResult(`Predicted diagnosis: ${response.data.result}`);
      } else if (response.data && response.data.diagnosis) {
        setResult(`Predicted diagnosis: ${response.data.diagnosis}`);
      } else {
        setResult(`Analysis complete. Raw response: ${JSON.stringify(response.data)}`);
      }
      
    } catch (err: any) {
      console.error('Prediction API error:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError("Request timed out. Please try again with a smaller image.");
      } else if (err.response) {
        const status = err.response.status;
        const errorMessage = err.response.data?.error || err.response.data?.message || 'Prediction service error';
        
        if (status === 404) {
          setError(`The diagnostic model for ${currentDoctor.spec_name} is not available. Please contact system administrator.`);
        } else if (status >= 500) {
          setError(`Server error (${status}): The prediction service is temporarily unavailable.`);
        } else {
          setError(`Failed to get prediction (${status}): ${errorMessage}`);
        }
      } else if (err.request) {
        setError("Cannot connect to prediction service. Please check if the diagnostic models are running.");
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
              {result && (
                <div className="alert alert-success mt-3" role="alert">
                  {result}
                </div>
              )}
              {error && (
                <div className="alert alert-danger mt-3" role="alert">
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
