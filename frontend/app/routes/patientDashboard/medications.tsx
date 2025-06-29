import { useCurrentPatientMedications } from "../../api/queries/useMedications";

export default function MedicationsPage() {
  const { data: medications, isLoading, error } = useCurrentPatientMedications();

  if (isLoading) {
    return (
      <div className="health-card">
        <h4>
          <i className="fas fa-prescription-bottle me-2"></i>Medications
        </h4>
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading medications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="health-card">
        <h4>
          <i className="fas fa-prescription-bottle me-2"></i>Medications
        </h4>
        <div className="alert alert-danger mt-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Error loading medications: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="health-card">
      <h4>
        <i className="fas fa-prescription-bottle me-2"></i>Medications
      </h4>

      {!medications || medications.length === 0 ? (
        <div className="alert alert-info mt-3">
          <i className="fas fa-info-circle me-2"></i>
          No current medications found.
        </div>
      ) : (
        <div className="mt-3">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage & Instructions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((medication) => (
                  <tr key={medication.medication_id}>
                    <td>
                      <strong>{medication.medication_name}</strong>
                    </td>
                    <td>{medication.dosage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Total medications: {medications.length}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
