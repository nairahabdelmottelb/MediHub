import { useState } from "react";
import { DashboardContainer } from "../../components/doctorDashboard/Containers";

interface TranscriptionResult {
  text: string;
  summary: string;
  keyPoints: string[];
  timestamp: string;
}

export default function DrTranscriptions() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<
    TranscriptionResult[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Replace with actual API call to your transcription service
      // This is a mock implementation
      const formData = new FormData();
      formData.append("file", file);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock response
      const mockResult: TranscriptionResult = {
        text: "Patient presented with symptoms of fever and cough. Temperature was 38.5°C. Recommended rest and prescribed medication.",
        summary: "Patient with fever and cough, prescribed medication",
        keyPoints: [
          "Fever: 38.5°C",
          "Cough present",
          "Medication prescribed",
          "Rest recommended",
        ],
        timestamp: new Date().toLocaleString(),
      };

      setTranscriptionResults((prev) => [mockResult, ...prev]);
      setFile(null);
    } catch (err) {
      setError("Failed to process the file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardContainer>
      <div className="transcriptions-container">
        <div className="upload-section mb-4">
          <h3 className="mb-3">Upload Audio/Video</h3>
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="mb-3">
              <input
                type="file"
                className="form-control"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isProcessing || !file}
            >
              {isProcessing ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Processing...
                </>
              ) : (
                "Process File"
              )}
            </button>
          </form>
          {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>

        <div className="results-section">
          <h3 className="mb-3">Transcription Results</h3>
          {transcriptionResults.length === 0 ? (
            <div className="alert alert-info">
              No transcriptions yet. Upload a file to get started.
            </div>
          ) : (
            <div className="results-list">
              {transcriptionResults.map((result, index) => (
                <div key={index} className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span className="text-muted">{result.timestamp}</span>
                    <button className="btn btn-sm btn-outline-primary">
                      <i className="fas fa-download me-2" />
                      Download
                    </button>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">Summary</h5>
                    <p className="card-text">{result.summary}</p>

                    <h5 className="card-title mt-3">Key Points</h5>
                    <ul className="list-group list-group-flush">
                      {result.keyPoints.map((point, i) => (
                        <li key={i} className="list-group-item">
                          {point}
                        </li>
                      ))}
                    </ul>

                    <h5 className="card-title mt-3">Full Transcription</h5>
                    <p className="card-text">{result.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardContainer>
  );
}
