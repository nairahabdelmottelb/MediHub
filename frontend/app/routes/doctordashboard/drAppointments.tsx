import { DashboardContainer } from "../../components/doctorDashboard/Containers";
import { format } from 'date-fns';
import { useState } from 'react';
import { useDoctorAppointments, useSummarizeNotes } from '~/api/queries/useDoctorAppointments';

export default function DrAppointments() {
  const { data: appointments, isLoading, error } = useDoctorAppointments();
  const summarizeNotesMutation = useSummarizeNotes();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [summaries, setSummaries] = useState<Record<number, string>>({});
  const [summarizingIds, setSummarizingIds] = useState<Set<number>>(new Set());

  // Function to view appointment details
  const handleViewAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
  };

  // Function to summarize notes
  const handleSummarizeNotes = async (appointmentId: number, notes: string) => {
    if (!notes || notes.trim() === "") {
      alert("No notes to summarize for this appointment.");
      return;
    }

    setSummarizingIds(prev => new Set(prev).add(appointmentId));

    try {
      const summary = await summarizeNotesMutation.mutateAsync(notes);
      setSummaries(prev => ({
        ...prev,
        [appointmentId]: summary
      }));
    } catch (error) {
      console.error("Error summarizing notes:", error);
      alert("Failed to summarize notes. Please try again.");
    } finally {
      setSummarizingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-success';
      case 'Cancelled':
        return 'bg-danger';
      case 'Scheduled':
      default:
        return 'bg-primary';
    }
  };

  if (isLoading) {
    return (
      <div className="row">
        <div className="col-12">
          <DashboardContainer>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </DashboardContainer>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="row">
        <div className="col-12">
          <DashboardContainer>
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Error loading appointments. Please try again.
            </div>
          </DashboardContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <DashboardContainer>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-calendar-check me-2" />
              Patient Appointments
            </h4>
            <div className="text-muted">
              <i className="fas fa-info-circle me-2"></i>
              {appointments?.length || 0} appointments found
            </div>
          </div>

          {appointments && appointments.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Notes</th>
                    <th>Summary</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.appointment_id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2">
                            <i className="fas fa-user text-primary" />
                          </div>
                          <strong>{appointment.patient_name}</strong>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}
                          </div>
                          <small className="text-muted">
                            {format(new Date(appointment.appointment_date), 'h:mm a')}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td>
                        {appointment.priority_flag ? (
                          <span className="badge bg-warning">
                            <i className="fas fa-exclamation-triangle me-1" />
                            High
                          </span>
                        ) : (
                          <span className="badge bg-secondary">Normal</span>
                        )}
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {appointment.notes ? (
                            <small>{appointment.notes}</small>
                          ) : (
                            <small className="text-muted">No notes</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ minWidth: '150px' }}>
                          {summaries[appointment.appointment_id] ? (
                            <div className="alert alert-info alert-sm p-2 mb-0">
                              <small>{summaries[appointment.appointment_id]}</small>
                            </div>
                          ) : appointment.notes && appointment.notes.trim() ? (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleSummarizeNotes(appointment.appointment_id, appointment.notes)}
                              disabled={summarizingIds.has(appointment.appointment_id)}
                            >
                              {summarizingIds.has(appointment.appointment_id) ? (
                                <>
                                  <div className="spinner-border spinner-border-sm me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                  Summarizing...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-magic me-2" />
                                  Summarize
                                </>
                              )}
                            </button>
                          ) : (
                            <small className="text-muted">No notes to summarize</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm px-3 py-1 d-inline-flex align-items-center"
                            onClick={() => handleViewAppointment(appointment)}
                          >
                            <i className="fas fa-eye me-2" />
                            View
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm px-3 py-1 d-inline-flex align-items-center"
                            onClick={() => window.print()}
                          >
                            <i className="fas fa-print me-2" />
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="fas fa-calendar-times fa-3x text-muted"></i>
              </div>
              <h5 className="text-muted">No Appointments Found</h5>
              <p className="text-muted">
                Appointments will appear here once patients book appointments with you.
              </p>
              <button className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
                Create New Appointment
              </button>
            </div>
          )}
        </DashboardContainer>
      </div>

      {/* View Appointment Details Modal */}
      {showViewModal && selectedAppointment && (
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
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6><i className="fas fa-user me-2"></i>Patient Information</h6>
                    <p><strong>Name:</strong> {selectedAppointment.patient_name}</p>
                    <p><strong>Date:</strong> {format(new Date(selectedAppointment.appointment_date), "MMMM dd, yyyy")}</p>
                    <p><strong>Time:</strong> {format(new Date(selectedAppointment.appointment_date), "h:mm a")}</p>
                    <p><strong>Status:</strong>
                      <span className={`badge ms-2 ${getStatusBadgeClass(selectedAppointment.status)}`}>
                        {selectedAppointment.status}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6><i className="fas fa-info-circle me-2"></i>Appointment Details</h6>
                    <p><strong>Appointment ID:</strong> #{selectedAppointment.appointment_id}</p>
                    <p><strong>Patient ID:</strong> #{selectedAppointment.patient_id}</p>
                    <p><strong>Priority:</strong>
                      {selectedAppointment.priority_flag ? (
                        <span className="badge bg-warning ms-2">High Priority</span>
                      ) : (
                        <span className="badge bg-secondary ms-2">Normal</span>
                      )}
                    </p>
                    <p><strong>Slot ID:</strong> #{selectedAppointment.slot_id}</p>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="mt-4">
                    <h6><i className="fas fa-sticky-note me-2"></i>Appointment Notes</h6>
                    <div className="alert alert-light" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedAppointment.notes}
                    </div>

                    {summaries[selectedAppointment.appointment_id] && (
                      <div className="mt-3">
                        <h6><i className="fas fa-magic me-2"></i>AI Summary</h6>
                        <div className="alert alert-info">
                          {summaries[selectedAppointment.appointment_id]}
                        </div>
                      </div>
                    )}

                    {!summaries[selectedAppointment.appointment_id] && (
                      <div className="mt-3">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleSummarizeNotes(selectedAppointment.appointment_id, selectedAppointment.notes)}
                          disabled={summarizingIds.has(selectedAppointment.appointment_id)}
                        >
                          {summarizingIds.has(selectedAppointment.appointment_id) ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                              Generating Summary...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-magic me-2" />
                              Generate AI Summary
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                >
                  <i className="fas fa-print me-2"></i>
                  Print Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
