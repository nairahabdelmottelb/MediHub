import React, { useState, useMemo } from "react";
import { useDoctors } from "~/api/queries/useDoctorManagement";
import { useAvailableTimeslots, useCreateAppointment } from "~/api/queries/useAppointments";

export default function BookAppointment() {
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeslot, setSelectedTimeslot] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // API hooks
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const { data: timeslots, isLoading: timeslotsLoading } = useAvailableTimeslots(
    selectedDoctor ? parseInt(selectedDoctor) : undefined,
    selectedDate
  );
  const createAppointmentMutation = useCreateAppointment();

  // Filter timeslots for the selected date and doctor
  const availableTimeslots = useMemo(() => {
    if (!timeslots || !selectedDate || !selectedDoctor) return [];

    const dateString = selectedDate;
    return timeslots.filter(slot => {
      const slotDate = new Date(slot.start_time).toISOString().split('T')[0];
      return slotDate === dateString &&
        slot.doctor_id === parseInt(selectedDoctor) &&
        slot.is_available === 1; // Backend returns 1 for available
    });
  }, [timeslots, selectedDate, selectedDoctor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (!selectedDoctor || !selectedTimeslot || !selectedDate) {
        setError("Please select a doctor, date, and time slot.");
        return;
      }

      await createAppointmentMutation.mutateAsync({
        slot_id: parseInt(selectedTimeslot),
        notes: notes || undefined,
        priority_flag: false
      });

      setSuccess("Appointment booked successfully!");
      // Reset form
      setSelectedDoctor("");
      setSelectedDate("");
      setSelectedTimeslot("");
      setNotes("");
    } catch (err: any) {
      console.error("Appointment booking error:", err);
      setError(err?.response?.data?.detail || "Failed to book appointment. Please try again.");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Book Appointment</h2>
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="doctor" className="form-label">
                    Select Doctor
                  </label>
                  <select
                    className="form-control"
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => {
                      setSelectedDoctor(e.target.value);
                      setSelectedTimeslot(""); // Reset timeslot when doctor changes
                    }}
                    required
                    disabled={doctorsLoading}
                  >
                    <option value="">
                      {doctorsLoading ? "Loading doctors..." : "Choose a doctor..."}
                    </option>
                    {doctors?.map((doctor) => (
                      <option key={doctor.doctor_id} value={doctor.doctor_id}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="date" className="form-label">
                    Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTimeslot(""); // Reset timeslot when date changes
                    }}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="timeslot" className="form-label">
                    Available Time Slots
                  </label>
                  <select
                    className="form-control"
                    id="timeslot"
                    value={selectedTimeslot}
                    onChange={(e) => setSelectedTimeslot(e.target.value)}
                    required
                    disabled={!selectedDoctor || !selectedDate || timeslotsLoading}
                  >
                    <option value="">
                      {!selectedDoctor || !selectedDate
                        ? "Please select doctor and date first"
                        : timeslotsLoading
                          ? "Loading available slots..."
                          : availableTimeslots.length === 0
                            ? "No available slots for selected date"
                            : "Choose a time slot..."}
                    </option>
                    {availableTimeslots.map((slot) => {
                      const startTime = new Date(slot.start_time);
                      const endTime = new Date(slot.end_time);
                      return (
                        <option key={slot.slot_id} value={slot.slot_id}>
                          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                          {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information about your appointment..."
                  />
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createAppointmentMutation.isPending}
                  >
                    {createAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
