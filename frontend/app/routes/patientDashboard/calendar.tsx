export default function Calendar() {
  return (
    <div className="health-card">
      <h4>
        <i className="fas fa-calendar-check me-2" />Appointments
      </h4>
      <div className="alert alert-info mt-3">
        Next appointment: March 25, 2024 at 10:00 AM
      </div>
      <button className="btn btn-success">
        <i className="fas fa-plus me-2" />Book New Appointment
      </button>
    </div>
  );
}
