export default function Alerts() {
  return (
    <div className="health-card">
      <h4>
        <i className="fas fa-bell"></i> Alerts
      </h4>

      <div className="list-group mt-3">
        <div className="alert alert-success mt-3">
          No new alerts, we will keep you updated if anything changes.
        </div>
      </div>
    </div>
  );
}
