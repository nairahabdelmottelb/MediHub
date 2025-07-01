import { useState } from "react";
import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { useTranscribeFile, type TranscriptionResponse } from "~/api/mutations/useTranscribeFile";

export default function DrTranscriptions() {
  const [file, setFile] = useState<File | null>(null);
  const [transcriptionResults, setTranscriptionResults] = useState<TranscriptionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const transcribeMutation = useTranscribeFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      const validTypes = ['audio/', 'video/'];
      const isValidType = validTypes.some(type => selectedFile.type.startsWith(type));

      if (!isValidType) {
        setError("Please select a valid audio or video file");
        return;
      }

      // Validate file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (selectedFile.size > maxSize) {
        setError("File size must be less than 100MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setError(null);

    try {
      const result = await transcribeMutation.mutateAsync({ file });

      // Validate the result before adding it to state
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from transcription service');
      }

      // Ensure required fields exist
      const validatedResult: TranscriptionResponse = {
        text: result.text || 'Transcription not available',
        summary: result.summary || 'Summary not available',
        keyPoints: Array.isArray(result.keyPoints) ? result.keyPoints : [],
        timestamp: result.timestamp || new Date().toLocaleString(),
        confidence: result.confidence,
        duration: result.duration,
        language: result.language
      };

      setTranscriptionResults((prev) => [validatedResult, ...prev]);
      setFile(null);

      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Failed to process the file. Please check your connection and try again.");
    }
  };

  const handleDownload = (result: TranscriptionResponse, index: number) => {
    const content = `Medical Transcription Report
Generated: ${result.timestamp}
${result.confidence ? `Confidence: ${(result.confidence * 100).toFixed(1)}%` : ''}
${result.duration ? `Duration: ${result.duration} seconds` : ''}
${result.language ? `Language: ${result.language}` : ''}

SUMMARY:
${result.summary || 'Summary not available'}

KEY POINTS:
${result.keyPoints && Array.isArray(result.keyPoints) && result.keyPoints.length > 0
        ? result.keyPoints.map(point => `• ${point}`).join('\n')
        : '• No key points available'}

FULL TRANSCRIPTION:
${result.text || 'Transcription not available'}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${index + 1}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension || '')) {
      return 'fas fa-music';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) {
      return 'fas fa-video';
    }
    return 'fas fa-file';
  };


  return (
    <DashboardContainer>
      <div className="transcriptions-container">
        <div className="upload-section mb-4">
          <h3 className="mb-3">
            <i className="fas fa-microphone-alt me-2"></i>
            Upload Audio/Video for Transcription
          </h3>
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="mb-3">
              <label htmlFor="file-upload" className="form-label">
                Select audio or video file to transcribe
              </label>
              <input
                id="file-upload"
                type="file"
                className="form-control"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                disabled={transcribeMutation.isPending}
              />
              {file && (
                <div className="mt-2 text-muted">
                  <i className={getFileTypeIcon(file.name)}></i>
                  <span className="ms-2">{file.name}</span>
                  <span className="ms-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={transcribeMutation.isPending || !file}
            >
              {transcribeMutation.isPending ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-play me-2"></i>
                  Process File
                </>
              )}
            </button>
          </form>
          {error && (
            <div className="alert alert-danger mt-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          {transcribeMutation.error && (
            <div className="alert alert-danger mt-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {transcribeMutation.error instanceof Error ? transcribeMutation.error.message : 'An error occurred during transcription'}
            </div>
          )}
        </div>

        <div className="results-section">
          <h3 className="mb-3">
            <i className="fas fa-file-alt me-2"></i>
            Transcription Results
          </h3>
          {transcriptionResults.length === 0 ? (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              No transcriptions yet. Upload an audio or video file to get started.
            </div>
          ) : (
            <div className="results-list">
              {transcriptionResults.map((result, index) => (
                <div key={index} className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        {result.timestamp}
                      </span>
                      {result.confidence && (
                        <span className="badge bg-success ms-3">
                          {(result.confidence * 100).toFixed(1)}% accuracy
                        </span>
                      )}
                      {result.duration && (
                        <span className="text-muted ms-3">
                          <i className="fas fa-stopwatch me-1"></i>
                          {result.duration}s
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleDownload(result, index)}
                    >
                      <i className="fas fa-download me-2" />
                      Download
                    </button>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="fas fa-clipboard-list me-2"></i>
                      Summary
                    </h5>
                    <p className="card-text">
                      {result.summary || 'Summary not available for this transcription.'}
                    </p>

                    <h5 className="card-title mt-4">
                      <i className="fas fa-list-ul me-2"></i>
                      Key Points
                    </h5>
                    {result.keyPoints && Array.isArray(result.keyPoints) && result.keyPoints.length > 0 ? (
                      <ul className="list-group list-group-flush">
                        {result.keyPoints.map((point, i) => (
                          <li key={i} className="list-group-item d-flex align-items-center">
                            <i className="fas fa-check-circle text-success me-2"></i>
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        No key points available for this transcription.
                      </div>
                    )}

                    <h5 className="card-title mt-4">
                      <i className="fas fa-file-audio me-2"></i>
                      Full Transcription
                    </h5>
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <p className="card-text text-muted mb-0 font-monospace">
                          {result.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .transcriptions-container {
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .upload-form {
          padding: 20px;
          border: 2px dashed #dee2e6;
          border-radius: 8px;
          background-color: #f8f9fa;
          transition: all 0.3s ease;
        }
        
        .upload-form:hover {
          border-color: #007bff;
          background-color: #e3f2fd;
        }
        
        .results-list .card {
          border: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }
        
        .results-list .card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }
        
        .font-monospace {
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .card-body h5 {
          color: #495057;
          font-weight: 600;
        }
        
        .badge {
          font-size: 0.75em;
        }
      `}</style>
    </DashboardContainer>
  );
}
