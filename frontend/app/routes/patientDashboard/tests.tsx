export default function TestsPage() {
  return (
    <div className="health-card">
      <h4>
        <i className="fas fa-flask"></i> Lab Test Results
      </h4>

      <div className="list-group mt-3">
        <div className="alert alert-success mt-3">
          No available lab test results.
        </div>
      </div>
    </div>
  );
}
