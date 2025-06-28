import React, { useState } from "react";
import { DashboardContainer } from "~/components/doctorDashboard/Containers";

export default function AddMedicalRecord() {
  const [record, setRecord] = useState({
    patientName: "",
    patientId: "",
    recordType: "",
    date: "",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    medications: "",
    followUp: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement medical record creation logic
    console.log("Creating medical record:", record);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setRecord({
      ...record,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <DashboardContainer>
      <h2 className="mb-4">
        <i className="fas fa-file-medical me-2"></i>
        Add Medical Record
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6">
            <label htmlFor="patientName" className="form-label">
              Patient Name
            </label>
            <input
              type="text"
              className="form-control"
              id="patientName"
              name="patientName"
              value={record.patientName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="patientId" className="form-label">
              Patient ID
            </label>
            <input
              type="text"
              className="form-control"
              id="patientId"
              name="patientId"
              value={record.patientId}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <label htmlFor="recordType" className="form-label">
              Record Type
            </label>
            <select
              className="form-select"
              id="recordType"
              name="recordType"
              value={record.recordType}
              onChange={handleChange}
              required
            >
              <option value="">Select type...</option>
              <option value="consultation">Consultation</option>
              <option value="emergency">Emergency Visit</option>
              <option value="surgery">Surgery</option>
              <option value="follow-up">Follow-up</option>
              <option value="lab-result">Lab Result</option>
              <option value="imaging">Imaging Result</option>
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="date" className="form-label">
              Date
            </label>
            <input
              type="date"
              className="form-control"
              id="date"
              name="date"
              value={record.date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="symptoms" className="form-label">
            Symptoms
          </label>
          <textarea
            className="form-control"
            id="symptoms"
            name="symptoms"
            rows={3}
            value={record.symptoms}
            onChange={handleChange}
            placeholder="Describe patient symptoms..."
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="diagnosis" className="form-label">
            Diagnosis
          </label>
          <textarea
            className="form-control"
            id="diagnosis"
            name="diagnosis"
            rows={3}
            value={record.diagnosis}
            onChange={handleChange}
            placeholder="Medical diagnosis..."
            required
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="treatment" className="form-label">
            Treatment Plan
          </label>
          <textarea
            className="form-control"
            id="treatment"
            name="treatment"
            rows={3}
            value={record.treatment}
            onChange={handleChange}
            placeholder="Treatment provided or planned..."
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="medications" className="form-label">
            Medications Prescribed
          </label>
          <textarea
            className="form-control"
            id="medications"
            name="medications"
            rows={2}
            value={record.medications}
            onChange={handleChange}
            placeholder="List of medications prescribed..."
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="followUp" className="form-label">
            Follow-up Instructions
          </label>
          <textarea
            className="form-control"
            id="followUp"
            name="followUp"
            rows={2}
            value={record.followUp}
            onChange={handleChange}
            placeholder="Follow-up appointments, tests, or instructions..."
          ></textarea>
        </div>

        <div className="mb-4">
          <label htmlFor="notes" className="form-label">
            Additional Notes
          </label>
          <textarea
            className="form-control"
            id="notes"
            name="notes"
            rows={3}
            value={record.notes}
            onChange={handleChange}
            placeholder="Any additional notes or observations..."
          ></textarea>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            <i className="fas fa-save me-2"></i>
            Save Medical Record
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
