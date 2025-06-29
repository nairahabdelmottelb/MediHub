import { useCurrentPatientMedicalRecords } from "../../api/queries/useMedicalRecords";

export default function TestsPage() {
  const { data: medicalRecords, isLoading, error } = useCurrentPatientMedicalRecords();

  if (isLoading) {
    return (
      <div className="health-card">
        <h4>
          <i className="fas fa-flask me-2"></i>Lab Test Results
        </h4>
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading lab test results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="health-card">
        <h4>
          <i className="fas fa-flask me-2"></i>Lab Test Results
        </h4>
        <div className="alert alert-danger mt-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error loading lab test results: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  // Filter medical records that have lab results
  const recordsWithLabResults = medicalRecords?.filter(record =>
    record.lab_results && record.lab_results.trim() !== ''
  ) || [];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="health-card">
      <h4>
        <i className="fas fa-flask me-2"></i>Lab Test Results
      </h4>

      {recordsWithLabResults.length === 0 ? (
        <div className="alert alert-info mt-3">
          <i className="fas fa-info-circle me-2"></i>
          No lab test results available.
        </div>
      ) : (
        <div className="mt-3">
          <div className="list-group">
            {recordsWithLabResults
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((record) => (
                <div key={record.record_id} className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">
                      <i className="fas fa-microscope me-2 text-primary"></i>
                      Lab Results - {record.diagnosis}
                    </h6>
                    <small className="text-muted">
                      {formatDate(record.created_at)}
                    </small>
                  </div>

                  {record.doctor && (
                    <p className="mb-2">
                      <small className="text-muted">
                        <i className="fas fa-user-md me-1"></i>
                        Ordered by: Dr. {record.doctor.first_name} {record.doctor.last_name}
                      </small>
                    </p>
                  )}

                  <div className="lab-results-container">
                    <div className="p-3 bg-light rounded border-start border-primary border-4">
                      <small className="text-muted fw-bold">
                        <i className="fas fa-flask me-1"></i>
                        Test Results:
                      </small>
                      <div className="mt-1">
                        <pre className="mb-0" style={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'inherit',
                          fontSize: '0.9rem',
                          color: '#495057'
                        }}>
                          {record.lab_results}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {record.appointment_id && (
                    <small className="text-muted mt-2 d-block">
                      <i className="fas fa-calendar-check me-1"></i>
                      Appointment ID: {record.appointment_id}
                    </small>
                  )}
                </div>
              ))}
          </div>

          <div className="mt-3">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Total lab results: {recordsWithLabResults.length} | Sorted by most recent first
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
