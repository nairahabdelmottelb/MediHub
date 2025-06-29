import React, { useState, useEffect } from "react";
import { DashboardContainer } from "~/components/doctorDashboard/Containers";
import { useCurrentDoctor } from "~/api/queries/useCurrentDoctor";
import { useAvailableTimeslots, useCreateAppointment } from "~/api/queries/useAppointments";
import { useSearchPatients } from "~/api/queries/usePatients";
import { format, parse, isAfter, startOfDay } from "date-fns";

export default function NewAppointment() {
  const { data: currentDoctor, isLoading: doctorLoading } = useCurrentDoctor();
  const { data: timeslots, isLoading: timeslotsLoading } = useAvailableTimeslots(currentDoctor?.doctor_id);
  const createAppointmentMutation = useCreateAppointment();

  const [formData, setFormData] = useState({
    selectedPatient: null as any,
    appointmentType: "",
    selectedDate: "",
    selectedTimeslot: null as any,
    notes: "",
    priorityFlag: false,
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  const { data: searchResults } = useSearchPatients(patientSearch);

  // Get available dates (next 30 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Filter timeslots for selected date and doctor
  const getFilteredTimeslots = () => {
    if (!timeslots || !formData.selectedDate || !currentDoctor) {
      return [];
    }

    const selectedDate = new Date(formData.selectedDate);
    return timeslots.filter(slot => {
      const slotDate = new Date(slot.start_time);
      const isSameDate = slotDate.toDateString() === selectedDate.toDateString();
      const isDoctorSlot = slot.doctor_id === currentDoctor.doctor_id;
      const isAvailable = slot.is_available === 1;
      const isFuture = isAfter(new Date(slot.start_time), new Date());

      return isSameDate && isDoctorSlot && isAvailable && isFuture;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectedPatient) {
      newErrors.patient = "Please select a patient";
    }
    if (!formData.appointmentType) {
      newErrors.appointmentType = "Please select an appointment type";
    }
    if (!formData.selectedDate) {
      newErrors.date = "Please select a date";
    }
    if (!formData.selectedTimeslot) {
      newErrors.timeslot = "Please select a time slot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      const appointmentData = {
        slot_id: formData.selectedTimeslot.slot_id,
        patient_id: formData.selectedPatient.patient_id,
        notes: formData.notes || `${formData.appointmentType} appointment`,
        priority_flag: formData.priorityFlag,
      };

      await createAppointmentMutation.mutateAsync(appointmentData);

      setSuccessMessage("Appointment scheduled successfully!");

      // Reset form
      setFormData({
        selectedPatient: null,
        appointmentType: "",
        selectedDate: "",
        selectedTimeslot: null,
        notes: "",
        priorityFlag: false,
      });
      setPatientSearch("");
      setErrors({});

    } catch (error: any) {
      console.error("Error creating appointment:", error);
      setErrors({
        submit: error.response?.data?.detail || "Failed to create appointment. Please try again."
      });
    }
  };

  const handlePatientSelect = (patient: any) => {
    setFormData(prev => ({ ...prev, selectedPatient: patient }));
    setPatientSearch(`${patient.first_name} ${patient.last_name} (${patient.email})`);
    setShowPatientDropdown(false);
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDate: date,
      selectedTimeslot: null // Reset timeslot when date changes
    }));
  };

  if (doctorLoading) {
    return (
      <DashboardContainer>
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <h2 className="mb-4">
        <i className="fas fa-calendar-plus me-2"></i>
        Schedule New Appointment
      </h2>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
        </div>
      )}

      {errors.submit && (
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Patient Selection */}
          <div className="col-md-6 mb-3">
            <label htmlFor="patientSearch" className="form-label">
              <i className="fas fa-user me-1"></i>
              Select Patient *
            </label>
            <div className="position-relative">
              <input
                type="text"
                className={`form-control ${errors.patient ? 'is-invalid' : ''}`}
                id="patientSearch"
                placeholder="Search by name or email..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                  if (e.target.value.length < 2) {
                    setFormData(prev => ({ ...prev, selectedPatient: null }));
                  }
                }}
                onFocus={() => setShowPatientDropdown(true)}
              />
              {errors.patient && <div className="invalid-feedback">{errors.patient}</div>}

              {/* Patient Search Dropdown */}
              {showPatientDropdown && searchResults && searchResults.length > 0 && (
                <div className="dropdown-menu show w-100 mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResults.map((patient) => (
                    <button
                      key={patient.patient_id}
                      type="button"
                      className="dropdown-item"
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <div>
                        <strong>{patient.first_name} {patient.last_name}</strong>
                        <small className="text-muted d-block">{patient.email}</small>
                        <small className="text-muted">
                          {patient.gender} • DOB: {format(new Date(patient.date_of_birth), "MMM dd, yyyy")}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Patient Display */}
              {formData.selectedPatient && (
                <div className="mt-2 p-2 bg-light rounded">
                  <small className="text-success">
                    <i className="fas fa-check me-1"></i>
                    Selected: <strong>{formData.selectedPatient.first_name} {formData.selectedPatient.last_name}</strong>
                    ({formData.selectedPatient.email})
                  </small>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Type */}
          <div className="col-md-6 mb-3">
            <label htmlFor="appointmentType" className="form-label">
              <i className="fas fa-stethoscope me-1"></i>
              Appointment Type *
            </label>
            <select
              className={`form-select ${errors.appointmentType ? 'is-invalid' : ''}`}
              id="appointmentType"
              value={formData.appointmentType}
              onChange={(e) => setFormData(prev => ({ ...prev, appointmentType: e.target.value }))}
            >
              <option value="">Select type...</option>
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="routine">Routine Checkup</option>
              <option value="surgery">Surgery Consultation</option>
              <option value="lab-review">Lab Results Review</option>
            </select>
            {errors.appointmentType && <div className="invalid-feedback">{errors.appointmentType}</div>}
          </div>

          {/* Date Selection */}
          <div className="col-md-6 mb-3">
            <label htmlFor="date" className="form-label">
              <i className="fas fa-calendar me-1"></i>
              Date *
            </label>
            <select
              className={`form-select ${errors.date ? 'is-invalid' : ''}`}
              id="date"
              value={formData.selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
            >
              <option value="">Select date...</option>
              {getAvailableDates().map((date) => (
                <option key={date.toISOString()} value={format(date, "yyyy-MM-dd")}>
                  {format(date, "EEEE, MMMM dd, yyyy")}
                </option>
              ))}
            </select>
            {errors.date && <div className="invalid-feedback">{errors.date}</div>}
          </div>

          {/* Time Slot Selection */}
          <div className="col-md-6 mb-3">
            <label htmlFor="timeslot" className="form-label">
              <i className="fas fa-clock me-1"></i>
              Available Time Slots *
            </label>
            {timeslotsLoading ? (
              <div className="form-control d-flex align-items-center">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Loading time slots...
              </div>
            ) : (
              <select
                className={`form-select ${errors.timeslot ? 'is-invalid' : ''}`}
                id="timeslot"
                value={formData.selectedTimeslot ? formData.selectedTimeslot.slot_id : ""}
                onChange={(e) => {
                  const selectedSlot = getFilteredTimeslots().find(slot => slot.slot_id === parseInt(e.target.value));
                  setFormData(prev => ({ ...prev, selectedTimeslot: selectedSlot || null }));
                }}
                disabled={!formData.selectedDate}
              >
                <option value="">
                  {!formData.selectedDate ? "Select date first..." : "Select time slot..."}
                </option>
                {getFilteredTimeslots().map((slot) => (
                  <option key={slot.slot_id} value={slot.slot_id}>
                    {format(new Date(slot.start_time), "h:mm a")} - {format(new Date(slot.end_time), "h:mm a")}
                  </option>
                ))}
              </select>
            )}
            {errors.timeslot && <div className="invalid-feedback">{errors.timeslot}</div>}
            {formData.selectedDate && getFilteredTimeslots().length === 0 && (
              <small className="text-warning">
                <i className="fas fa-exclamation-triangle me-1"></i>
                No available time slots for this date
              </small>
            )}
          </div>

          {/* Priority Flag */}
          <div className="col-12 mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="priorityFlag"
                checked={formData.priorityFlag}
                onChange={(e) => setFormData(prev => ({ ...prev, priorityFlag: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="priorityFlag">
                <i className="fas fa-exclamation-triangle me-1 text-warning"></i>
                Mark as Priority Appointment
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="col-12 mb-3">
            <label htmlFor="notes" className="form-label">
              <i className="fas fa-sticky-note me-1"></i>
              Notes
            </label>
            <textarea
              className="form-control"
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about the appointment..."
            ></textarea>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createAppointmentMutation.isPending}
          >
            {createAppointmentMutation.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Scheduling...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Schedule Appointment
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormData({
                selectedPatient: null,
                appointmentType: "",
                selectedDate: "",
                selectedTimeslot: null,
                notes: "",
                priorityFlag: false,
              });
              setPatientSearch("");
              setErrors({});
              setSuccessMessage("");
            }}
          >
            <i className="fas fa-times me-2"></i>
            Reset Form
          </button>
        </div>
      </form>
    </DashboardContainer>
  );
}
