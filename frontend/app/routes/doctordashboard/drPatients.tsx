import { DashboardContainer } from "~/components/doctorDashboard/Containers";

export default function drPatients() {
  return (
    <div className="row">
      <div className="col-md-6">
        <DashboardContainer>
          <h4>
            <i className="fas fa-users me-2" />
            Active Patients
          </h4>
          <div className="metric-card bg-primary mt-3">
            <h5>Total Patients</h5>
            <h2>24</h2>
          </div>
          <div className="metric-card bg-success mt-3">
            <h5>New Patients This Week</h5>
            <h2>3</h2>
          </div>
        </DashboardContainer>
      </div>
      <div className="col-md-6">
        <DashboardContainer>
          <h4>
            <i className="fas fa-calendar-check me-2" />
            Recent Appointments
          </h4>
          <div className="alert alert-info mt-3">
            <i className="fas fa-user me-2" />
            John Doe - Today at 2:00 PM
          </div>
          <div className="alert alert-info">
            <i className="fas fa-user me-2" />
            Jane Smith - Tomorrow at 10:00 AM
          </div>
        </DashboardContainer>
      </div>
    </div>
  );
}
