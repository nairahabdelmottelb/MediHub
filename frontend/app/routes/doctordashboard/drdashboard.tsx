import { DashboardContainer } from "~/components/doctorDashboard/Containers";
import { format } from "date-fns";
import { Link } from "react-router";
import { useState } from "react";
import { useCurrentDoctor } from "~/api/queries/useCurrentDoctor";
import { useTodaysAppointments, useDoctorDashboardStats, useRecentLabResults } from "~/api/queries/useDoctorDashboard";
import { useCancelAppointment } from "~/api/queries/useAppointments";

export default function drDashboard() {
  const { data: currentDoctor, isLoading: doctorLoading } = useCurrentDoctor();
  const { data: todaysAppointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useTodaysAppointments();
  const { data: dashboardStats, isLoading: statsLoading } = useDoctorDashboardStats();
  const { data: labResults, isLoading: labLoading } = useRecentLabResults();
  const cancelAppointmentMutation = useCancelAppointment();

  // State for modals and viewing details
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedLabResult, setSelectedLabResult] = useState<any>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showLabResultModal, setShowLabResultModal] = useState(false);

  // Function to view appointment details
  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  // Function to cancel appointment
  const handleCancelAppointment = async (appointmentId: number) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await cancelAppointmentMutation.mutateAsync(appointmentId);
        refetchAppointments();
      } catch (error) {
        console.error("Error canceling appointment:", error);
        alert("Failed to cancel appointment. Please try again.");
      }
    }
  };

  // Function to view lab result details
  const handleViewLabResult = (result: any) => {
    setSelectedLabResult(result);
    setShowLabResultModal(true);
  };

  if (doctorLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentDoctor) {
    return (
      <div className="alert alert-danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Unable to load doctor information. Please try again.
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* Quick Actions */}
      <div className="col-12">
        <DashboardContainer>
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-primary bg-opacity-10 rounded-3 h-100">
                <div>
                  <h6 className="mb-1">Today's Appointments</h6>
                  <h4 className="mb-0 fw-bold">
                    {statsLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      dashboardStats?.todaysAppointments ?? 0
                    )}
                  </h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-success bg-opacity-10 rounded-3 h-100">
                <div>
                  <h6 className="mb-1">New Lab Results</h6>
                  <h4 className="mb-0 fw-bold">
                    {labLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      labResults?.length ?? 0
                    )}
                  </h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-info bg-opacity-10 rounded-3 h-100">
                <div>
                  <h6 className="mb-1">Total Patients</h6>
                  <h4 className="mb-0 fw-bold">
                    {statsLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      dashboardStats?.totalPatients ?? 0
                    )}
                  </h4>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div className="d-flex align-items-center p-3 bg-warning bg-opacity-10 rounded-3 h-100">
                <div>
                  <h6 className="mb-1">Pending Reviews</h6>
                  <h4 className="mb-0 fw-bold">
                    {statsLoading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      dashboardStats?.pendingReviews ?? 0
                    )}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </DashboardContainer>
      </div>

      {/* Quick Action Buttons */}
      <div className="col-12">
        <div className="d-flex gap-3 flex-wrap">
          <Link
            to="/doctor/newAppointment"
            className="btn btn-primary d-inline-flex align-items-center"
          >
            <i className="fas fa-plus-circle me-2"></i>
            New Appointment
          </Link>
          <Link
            to="/doctor/createPrescription"
            className="btn btn-success d-inline-flex align-items-center"
          >
            <i className="fas fa-notes-medical me-2"></i>
            Create Prescription
          </Link>
          <Link
            to="/doctor/addMedicalRecord"
            className="btn btn-info text-white d-inline-flex align-items-center"
          >
            <i className="fas fa-file-medical me-2"></i>
            Add Medical Record
          </Link>
          <Link
            to="/doctor/manageSchedule"
            className="btn btn-warning text-white d-inline-flex align-items-center"
          >
            <i className="fas fa-calendar-alt me-2"></i>
            Manage Schedule
          </Link>
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
            <Link to="/doctor/appointments" className="btn btn-outline-primary btn-sm">
              <i className="fas fa-calendar-alt me-2"></i>
              View All
            </Link>
          </div>
          <div className="appointments-list">
            {appointmentsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : todaysAppointments && todaysAppointments.length > 0 ? (
              todaysAppointments.map((appointment) => (
                <div
                  key={appointment.appointment_id}
                  className="appointment-card shadow-sm border rounded-3 p-3 mb-3"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center mb-2">
                        <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2">
                          <i className="fas fa-user text-primary" />
                        </div>
                        <h5 className="mb-0">
                          {appointment.patient_first_name} {appointment.patient_last_name}
                        </h5>
                      </div>
                      <p className="mb-1 text-muted">
                        <i className="fas fa-clock me-2" />
                        {format(new Date(appointment.start_time), "h:mm a")}
                      </p>
                      <small className="text-muted">{appointment.appointment_type}</small>
                      {appointment.priority_flag && (
                        <span className="badge bg-danger ms-2">Priority</span>
                      )}
                    </div>
                    <div className="text-end">
                      <span
                        className={`badge ${appointment.status === "Completed"
                          ? "bg-success"
                          : appointment.status === "Cancelled"
                            ? "bg-danger"
                            : "bg-warning"
                          } mb-2 d-block`}
                      >
                        {appointment.status}
                      </span>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleViewAppointment(appointment)}
                          title="View Appointment Details"
                        >
                          <i className="fas fa-eye" />
                        </button>
                        {appointment.status === "Scheduled" && (
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleCancelAppointment(appointment.appointment_id)}
                            title="Cancel Appointment"
                            disabled={cancelAppointmentMutation.isPending}
                          >
                            <i className="fas fa-times" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted mb-0">No appointments scheduled for today.</p>
              </div>
            )}
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
            <Link to="/doctor/tests" className="btn btn-outline-primary btn-sm">
              <i className="fas fa-flask me-2"></i>
              View All
            </Link>
          </div>
          <div className="lab-results-list">
            {labLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : labResults && labResults.length > 0 ? (
              labResults.map((result) => (
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
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleViewLabResult(result)}
                      >
                        <i className="fas fa-eye me-2" />
                        View Report
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-muted mb-0">No new lab results available.</p>
              </div>
            )}
          </div>
        </DashboardContainer>
      </div>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-calendar-check me-2"></i>
                  Appointment Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAppointmentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6><i className="fas fa-user me-2"></i>Patient Information</h6>
                    <p><strong>Name:</strong> {selectedAppointment.patient_first_name} {selectedAppointment.patient_last_name}</p>
                    <p><strong>Time:</strong> {format(new Date(selectedAppointment.start_time), "MMMM dd, yyyy 'at' h:mm a")}</p>
                    <p><strong>Duration:</strong> {format(new Date(selectedAppointment.start_time), "h:mm a")} - {format(new Date(selectedAppointment.end_time), "h:mm a")}</p>
                  </div>
                  <div className="col-md-6">
                    <h6><i className="fas fa-info-circle me-2"></i>Appointment Details</h6>
                    <p><strong>Status:</strong> <span className={`badge ${selectedAppointment.status === "Completed" ? "bg-success" : selectedAppointment.status === "Cancelled" ? "bg-danger" : "bg-warning"}`}>{selectedAppointment.status}</span></p>
                    <p><strong>Type:</strong> {selectedAppointment.appointment_type || "General Consultation"}</p>
                    <p><strong>Priority:</strong> {selectedAppointment.priority_flag ?
                      <span className="badge bg-danger">High Priority</span> :
                      <span className="badge bg-secondary">Normal</span>
                    }</p>
                  </div>
                </div>
                {selectedAppointment.notes && (
                  <div className="mt-3">
                    <h6><i className="fas fa-sticky-note me-2"></i>Notes</h6>
                    <div className="alert alert-light">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAppointmentModal(false)}
                >
                  Close
                </button>
                {selectedAppointment.status === "Scheduled" && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      handleCancelAppointment(selectedAppointment.appointment_id);
                      setShowAppointmentModal(false);
                    }}
                  >
                    <i className="fas fa-times me-2"></i>
                    Cancel Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Result Details Modal */}
      {showLabResultModal && selectedLabResult && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-flask me-2"></i>
                  Lab Results Report
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLabResultModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6><i className="fas fa-user me-2"></i>Patient Information</h6>
                    <p><strong>Name:</strong> {selectedLabResult.patientName}</p>
                    <p><strong>Date:</strong> {format(selectedLabResult.date, "MMMM dd, yyyy")}</p>
                    <p><strong>Status:</strong> <span className="badge bg-info">New</span></p>
                  </div>
                  <div className="col-md-6">
                    <h6><i className="fas fa-stethoscope me-2"></i>Diagnosis</h6>
                    <div className="alert alert-primary">
                      {selectedLabResult.diagnosis}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <h6><i className="fas fa-vial me-2"></i>Lab Results</h6>
                  <div className="alert alert-light" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedLabResult.fullResults || selectedLabResult.testName}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLabResultModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print me-2"></i>
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
