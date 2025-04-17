import { DashboardContainer } from "~/components/doctorDashboard/Containers";
import { format } from "date-fns";

interface Appointment {
  id: number;
  patientName: string;
  time: Date;
  type: string;
  status: "scheduled" | "completed" | "cancelled";
}

interface LabResult {
  id: number;
  patientName: string;
  testName: string;
  date: Date;
  status: "new" | "viewed";
}

export default function drDashboard() {
  // Sample data - in a real app, this would come from an API
  const today = new Date();
  const appointments: Appointment[] = [
    {
      id: 1,
      patientName: "John Doe",
      time: new Date(today.setHours(10, 0)),
      type: "Regular Checkup",
      status: "scheduled",
    },
    {
      id: 2,
      patientName: "Jane Smith",
      time: new Date(today.setHours(14, 30)),
      type: "Follow-up",
      status: "scheduled",
    },
  ];

  const labResults: LabResult[] = [
    {
      id: 1,
      patientName: "John Doe",
      testName: "Blood Test",
      date: new Date(today.setDate(today.getDate() - 1)),
      status: "new",
    },
    {
      id: 2,
      patientName: "Jane Smith",
      testName: "X-Ray",
      date: new Date(today.setDate(today.getDate() - 2)),
      status: "new",
    },
  ];

  return (
    <div className="row g-4">
      {/* Quick Actions */}
      <div className="col-12">
        <DashboardContainer>
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-primary bg-opacity-10 rounded-3">
                <div className="rounded-circle bg-primary p-3 me-3">
                  <i className="fas fa-calendar-plus text-white fs-4" />
                </div>
                <div>
                  <h6 className="mb-1">Today's Appointments</h6>
                  <h4 className="mb-0 fw-bold">{appointments.length}</h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-success bg-opacity-10 rounded-3">
                <div className="rounded-circle bg-success p-3 me-3">
                  <i className="fas fa-flask text-white fs-4" />
                </div>
                <div>
                  <h6 className="mb-1">New Lab Results</h6>
                  <h4 className="mb-0 fw-bold">{labResults.length}</h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-info bg-opacity-10 rounded-3">
                <div className="rounded-circle bg-info p-3 me-3">
                  <i className="fas fa-user-injured text-white fs-4" />
                </div>
                <div>
                  <h6 className="mb-1">Total Patients</h6>
                  <h4 className="mb-0 fw-bold">124</h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-warning bg-opacity-10 rounded-3">
                <div className="rounded-circle bg-warning p-3 me-3">
                  <i className="fas fa-clock text-white fs-4" />
                </div>
                <div>
                  <h6 className="mb-1">Pending Reviews</h6>
                  <h4 className="mb-0 fw-bold">7</h4>
                </div>
              </div>
            </div>
          </div>
        </DashboardContainer>
      </div>

      {/* Quick Action Buttons */}
      <div className="col-12">
        <div className="d-flex gap-3 flex-wrap">
          <button className="btn btn-primary d-inline-flex align-items-center">
            <i className="fas fa-plus-circle me-2"></i>
            New Appointment
          </button>
          <button className="btn btn-success d-inline-flex align-items-center">
            <i className="fas fa-notes-medical me-2"></i>
            Create Prescription
          </button>
          <button className="btn btn-info text-white d-inline-flex align-items-center">
            <i className="fas fa-file-medical me-2"></i>
            Add Medical Record
          </button>
          <button className="btn btn-warning text-white d-inline-flex align-items-center">
            <i className="fas fa-calendar-alt me-2"></i>
            Manage Schedule
          </button>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="col-md-6">
        <DashboardContainer>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-calendar-day me-2" />
              Today's Appointments
            </h4>
            <button className="btn btn-outline-primary btn-sm">
              <i className="fas fa-calendar-alt me-2"></i>
              View All
            </button>
          </div>
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="appointment-card shadow-sm border rounded-3 p-3 mb-3"
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center mb-2">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2">
                        <i className="fas fa-user text-primary" />
                      </div>
                      <h5 className="mb-0">{appointment.patientName}</h5>
                    </div>
                    <p className="mb-1 text-muted">
                      <i className="fas fa-clock me-2" />
                      {format(appointment.time, "h:mm a")}
                    </p>
                    <small className="text-muted">{appointment.type}</small>
                  </div>
                  <div className="text-end">
                    <span
                      className={`badge ${
                        appointment.status === "completed"
                          ? "bg-success"
                          : appointment.status === "cancelled"
                          ? "bg-danger"
                          : "bg-warning"
                      } mb-2 d-block`}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </span>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-primary">
                        <i className="fas fa-eye" />
                      </button>
                      <button className="btn btn-outline-success">
                        <i className="fas fa-check" />
                      </button>
                      <button className="btn btn-outline-danger">
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardContainer>
      </div>

      {/* Lab Results Section */}
      <div className="col-md-6">
        <DashboardContainer>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-vial me-2" />
              New Lab Results
            </h4>
            <button className="btn btn-outline-primary btn-sm">
              <i className="fas fa-flask me-2"></i>
              View All
            </button>
          </div>
          <div className="lab-results-list">
            {labResults.map((result) => (
              <div
                key={result.id}
                className="lab-result-card shadow-sm border rounded-3 p-3 mb-3"
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center mb-2">
                      <div className="rounded-circle bg-info bg-opacity-10 p-2 me-2">
                        <i className="fas fa-flask text-info" />
                      </div>
                      <h5 className="mb-0">{result.patientName}</h5>
                    </div>
                    <p className="mb-1 text-muted">
                      <i className="fas fa-vial me-2" />
                      {result.testName}
                    </p>
                    <small className="text-muted">
                      <i className="fas fa-calendar me-2" />
                      {format(result.date, "MMM dd, yyyy")}
                    </small>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-info mb-2 d-block">New</span>
                    <button className="btn btn-primary btn-sm">
                      <i className="fas fa-eye me-2" />
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardContainer>
      </div>
    </div>
  );
}
