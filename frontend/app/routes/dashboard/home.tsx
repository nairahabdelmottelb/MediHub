import "bootstrap/dist/css/bootstrap.css";
import "../../components/Containers";

export default function Home() {
  return (
    <div className="row">
      <div className="col-md-4">
        <div className="health-card">
          <h4>
            <i className="fas fa-heartbeat me-2"/>Health Summary
          </h4>
          <div className="metric-card bg-primary mt-3">
            <h5>Heart Rate</h5>
            <h2>72 bpm</h2>
          </div>
          <div className="metric-card bg-success mt-3">
            <h5>Blood Pressure</h5>
            <h2>120/80</h2>
          </div>
        </div>
      </div>
      <div className="col-md-8">
        <div className="health-card">
          <h4>
            <i className="fas fa-bell me-2"/>Notifications
          </h4>
          <div className="alert alert-warning mt-3">
            <i className="fas fa-calendar-day me-2"/>
            Upcoming appointment tomorrow at 10:00 AM
          </div>
          <div className="alert alert-info">
            <i className="fas fa-file-medical me-2"/>
            New lab results available
          </div>
        </div>
      </div>
    </div>
  );
}
