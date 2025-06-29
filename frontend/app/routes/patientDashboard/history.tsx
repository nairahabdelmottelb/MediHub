import { useCurrentPatientMedicalRecords } from "../../api/queries/useMedicalRecords";

export default function HistoryPage() {
  const { data: medicalRecords, isLoading, error } = useCurrentPatientMedicalRecords();

  if (isLoading) {
    return (
      <div className="health-card">
        <h4>
          <i className="fas fa-file-medical me-2"></i>Medical History
        </h4>
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading medical history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="health-card">
        <h4>
          <i className="fas fa-file-medical me-2"></i>Medical History
        </h4>
        <div className="alert alert-danger mt-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error loading medical history: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

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
        <i className="fas fa-file-medical me-2"></i>Medical History
      </h4>

      {!medicalRecords || medicalRecords.length === 0 ? (
        <div className="alert alert-info mt-3">
          <i className="fas fa-info-circle me-2"></i>
          No medical records found.
        </div>
      ) : (
        <div className="mt-3">
          <div className="list-group">
            {medicalRecords
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((record) => (
                <div key={record.record_id} className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">
                      <i className="fas fa-stethoscope me-2 text-primary"></i>
                      {record.diagnosis}
                    </h6>
                    <small className="text-muted">
                      {formatDate(record.created_at)}
                    </small>
                  </div>

                  {record.doctor && (
                    <p className="mb-1">
                      <small className="text-muted">
                        <i className="fas fa-user-md me-1"></i>
                        Doctor: {record.doctor.first_name} {record.doctor.last_name}
                      </small>
                    </p>
                  )}

                  {record.prescriptions && (
                    <div className="mt-2">
                      <small className="text-muted fw-bold">
                        <i className="fas fa-pills me-1"></i>
                        Prescriptions:
                      </small>
                      <p className="mb-1 ms-3">
                        <small>{record.prescriptions}</small>
                      </p>
                    </div>
                  )}

                  {record.lab_results && (
                    <div className="mt-2">
                      <small className="text-muted fw-bold">
                        <i className="fas fa-flask me-1"></i>
                        Lab Results:
                      </small>
                      <p className="mb-1 ms-3">
                        <small>{record.lab_results}</small>
                      </p>
                    </div>
                  )}

                  {record.appointment_id && (
                    <small className="text-muted">
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
              Total records: {medicalRecords.length} | Sorted by most recent first
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
