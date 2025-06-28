import React, { useState } from "react";
import { DashboardContainer } from "~/components/doctorDashboard/Containers";

export default function NewAppointment() {
  const [formData, setFormData] = useState({
    patientName: "",
    patientEmail: "",
    appointmentType: "",
    date: "",
    time: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement appointment creation logic
    console.log("Creating appointment:", formData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <DashboardContainer>
      <h2 className="mb-4">
        <i className="fas fa-calendar-plus me-2"></i>
        Schedule New Appointment
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="patientName" className="form-label">
              Patient Name
            </label>
            <input
              type="text"
              className="form-control"
              id="patientName"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="patientEmail" className="form-label">
              Patient Email
            </label>
            <input
              type="email"
              className="form-control"
              id="patientEmail"
              name="patientEmail"
              value={formData.patientEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="appointmentType" className="form-label">
              Appointment Type
            </label>
            <select
              className="form-select"
              id="appointmentType"
              name="appointmentType"
              value={formData.appointmentType}
              onChange={handleChange}
              required
            >
              <option value="">Select type...</option>
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="routine">Routine Checkup</option>
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="date" className="form-label">
              Date
            </label>
            <input
              type="date"
              className="form-control"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="time" className="form-label">
              Time
            </label>
            <input
              type="time"
              className="form-control"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-12 mb-3">
            <label htmlFor="notes" className="form-label">
              Notes
            </label>
            <textarea
              className="form-control"
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the appointment..."
            ></textarea>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-save me-2"></i>
            Schedule Appointment
          </button>
          <button type="button" className="btn btn-secondary">
            <i className="fas fa-times me-2"></i>
            Cancel
          </button>
        </div>
      </form>
    </DashboardContainer>
  );
}
