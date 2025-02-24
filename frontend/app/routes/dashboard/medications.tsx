export default function MedicationsPage() {
  return (
    <div className="health-card">
      <h4>
        <i className="fas fa-prescription-bottle me-2"></i>Medications
      </h4>
      <div className="alert alert-success mt-3">No current medications</div>
      <button className="btn btn-primary">
        <i className="fas fa-plus me-2"></i>Request Prescription
      </button>
    </div>
  );
}
