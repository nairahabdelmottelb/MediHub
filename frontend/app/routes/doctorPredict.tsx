import React, { useState } from "react";

export default function DoctorPredict() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    try {
      // TODO: Replace with actual API call for prediction
      setTimeout(() => {
        setResult("Predicted diagnosis: Example Condition");
        setLoading(false);
      }, 2000);
    } catch (err) {
      setError("Failed to get prediction. Please try again.");
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
                    disabled={loading}
                  >
                    {loading ? "Analyzing..." : "Get Prediction"}
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
