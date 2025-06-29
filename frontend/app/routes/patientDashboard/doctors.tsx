import React from "react";
import { usePatientDoctors } from "~/api/queries/useAppointments";
import { Link } from "react-router";

export default function DoctorsPage() {
  const { data: doctors, isLoading, error } = usePatientDoctors();

  return (
    <div className="health-card">
      <h4>
        <i className="fas fa-user-md me-2"></i>My Doctors
      </h4>

      {isLoading && (
        <div className="text-center mt-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading your doctors...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Failed to load your doctors. Please try again later.
        </div>
      )}

      {!isLoading && !error && doctors && doctors.length === 0 && (
        <div className="alert alert-info mt-3" role="alert">
          <i className="fas fa-info-circle me-2"></i>
          You haven't had any appointments yet.
          <Link to="/patient/bookAppointment" className="ms-2 btn btn-sm btn-primary">
            Book your first appointment
          </Link>
        </div>
      )}

      {!isLoading && !error && doctors && doctors.length > 0 && (
        <div className="list-group mt-3">
          {doctors.map((doctor) => (
            <div key={doctor.doctor_id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h5 className="mb-1">
                    <i className="fas fa-user-md me-2 text-primary"></i>
                    Dr. {doctor.first_name} {doctor.last_name}
                  </h5>
                  <p className="mb-1 text-muted">
                    <i className="fas fa-building me-1"></i>
                    {doctor.department_name || "General Practice"}
                  </p>
                  <small className="text-muted">
                    <i className="fas fa-calendar-alt me-1"></i>
                    {doctor.appointment_count} appointment{doctor.appointment_count !== 1 ? 's' : ''}
                    {doctor.last_appointment && (
                      <span className="ms-2">
                        <i className="fas fa-clock me-1"></i>
                        Last visit: {new Date(doctor.last_appointment).toLocaleDateString()}
                      </span>
                    )}
                  </small>
                </div>
                <div className="text-end">
                  <div className="mb-2">
                    {doctor.statuses && doctor.statuses.length > 0 && (
                      doctor.statuses.map((status, index) => (
                        <span
                          key={index}
                          className={`badge me-1 ${status === "Completed"
                              ? "bg-success"
                              : status === "Scheduled"
                                ? "bg-primary"
                                : "bg-secondary"
                            }`}
                        >
                          {status}
                        </span>
                      ))
                    )}
                  </div>
                  <Link
                    to="/patient/bookAppointment"
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="fas fa-calendar-plus me-1"></i>
                    Book Again
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && doctors && doctors.length > 0 && (
        <div className="mt-3 text-center">
          <Link to="/patient/bookAppointment" className="btn btn-primary">
            <i className="fas fa-plus me-2"></i>
            Book New Appointment
          </Link>
        </div>
      )}
    </div>
  );
}
