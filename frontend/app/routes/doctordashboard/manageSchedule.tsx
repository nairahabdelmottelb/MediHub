import React, { useState } from "react";
import { DashboardContainer } from "~/components/doctorDashboard/Containers";
import { useCurrentDoctor } from "~/api/queries/useCurrentDoctor";
import { useDoctorTimeslots, useCreateDoctorTimeslots, useUpdateTimeslot, useDeleteTimeslot, type TimeSlot, type CreateTimeSlotData } from "~/api/queries/useTimeslots";

export default function ManageSchedule() {
  const { data: currentDoctor, isLoading: doctorLoading } = useCurrentDoctor();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Calculate date range for fetching timeslots (current week)
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const { data: timeslots, isLoading: timeslotsLoading, error, refetch } = useDoctorTimeslots(
    currentDoctor?.doctor_id || 0,
    startOfWeek.toISOString().split("T")[0],
    endOfWeek.toISOString().split("T")[0]
  );

  const createTimeslotsMutation = useCreateDoctorTimeslots(currentDoctor?.doctor_id || 0);
  const updateTimeslotMutation = useUpdateTimeslot();
  const deleteTimeslotMutation = useDeleteTimeslot();

  const [newSlot, setNewSlot] = useState<CreateTimeSlotData>({
    date: selectedDate,
    start_hour: 9,
    end_hour: 17,
    duration_minutes: 30,
  });

  const [showAdvancedModal, setShowAdvancedModal] = useState(false);

  const handleCreateSlots = async () => {
    if (!currentDoctor) return;

    try {
      await createTimeslotsMutation.mutateAsync(newSlot);
      setNewSlot({
        date: selectedDate,
        start_hour: 9,
        end_hour: 17,
        duration_minutes: 30,
      });
      refetch();
    } catch (error) {
      console.error("Error creating timeslots:", error);
    }
  };

  const handleToggleAvailability = async (slot: TimeSlot) => {
    try {
      await updateTimeslotMutation.mutateAsync({
        slotId: slot.slot_id,
        data: { is_available: !slot.is_available }
      });
      refetch();
    } catch (error) {
      console.error("Error updating timeslot:", error);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    try {
      await deleteTimeslotMutation.mutateAsync(slotId);
      refetch();
    } catch (error) {
      console.error("Error deleting timeslot:", error);
    }
  };

  // Filter timeslots for selected date
  const filteredSlots = timeslots?.filter(slot => {
    const slotDate = new Date(slot.start_time).toISOString().split("T")[0];
    return slotDate === selectedDate;
  }) || [];

  // Group slots by time for better display
  const groupedSlots: Record<string, TimeSlot[]> = filteredSlots.reduce((acc, slot) => {
    const time = new Date(slot.start_time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  if (doctorLoading) {
    return (
      <DashboardContainer>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </DashboardContainer>
    );
  }

  if (!currentDoctor) {
    return (
      <DashboardContainer>
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Unable to load doctor information. Please try again.
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <h2 className="mb-4">
        <i className="fas fa-calendar-alt me-2"></i>
        Manage Schedule
      </h2>

      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Add Time Slots</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="slotDate" className="form-label">
                  Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="slotDate"
                  value={newSlot.date}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, date: e.target.value })
                  }
                />
              </div>
              <div className="row">
                <div className="col-6 mb-3">
                  <label htmlFor="startHour" className="form-label">
                    Start Hour
                  </label>
                  <select
                    className="form-select"
                    id="startHour"
                    value={newSlot.start_hour}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, start_hour: parseInt(e.target.value) })
                    }
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 mb-3">
                  <label htmlFor="endHour" className="form-label">
                    End Hour
                  </label>
                  <select
                    className="form-select"
                    id="endHour"
                    value={newSlot.end_hour}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, end_hour: parseInt(e.target.value) })
                    }
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {(i + 1).toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="duration" className="form-label">
                  Slot Duration (minutes)
                </label>
                <select
                  className="form-select"
                  id="duration"
                  value={newSlot.duration_minutes}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, duration_minutes: parseInt(e.target.value) })
                  }
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
              <button
                className="btn btn-primary w-100"
                onClick={handleCreateSlots}
                disabled={createTimeslotsMutation.isPending}
              >
                {createTimeslotsMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>
                    Create Time Slots
                  </>
                )}
              </button>
              <small className="text-muted mt-2 d-block">
                This will create {Math.floor((newSlot.end_hour - newSlot.start_hour) * 60 / newSlot.duration_minutes)} slots
              </small>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Schedule for {selectedDate}</h5>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: "auto" }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body">
              {timeslotsLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Error loading timeslots. Please try again.
                </div>
              ) : filteredSlots.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No time slots scheduled for this date.
                </p>
              ) : (
                <div className="schedule-slots">
                  {Object.entries(groupedSlots).sort().map(([time, slots]) => (
                    <div key={time} className="mb-2">
                      {slots.map((slot) => (
                        <div
                          key={slot.slot_id}
                          className={`d-flex justify-content-between align-items-center p-3 mb-2 rounded ${slot.appointment_id
                            ? "bg-primary bg-opacity-10 border border-primary"
                            : !slot.is_available
                              ? "bg-danger bg-opacity-10 border border-danger"
                              : "bg-success bg-opacity-10 border border-success"
                            }`}
                        >
                          <div>
                            <strong>
                              {new Date(slot.start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })} - {new Date(slot.end_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </strong>
                            {slot.appointment_id && slot.patient_name && (
                              <div className="text-muted">
                                {slot.patient_name} - {slot.appointment_type || 'Appointment'}
                              </div>
                            )}
                            {!slot.appointment_id && (
                              <div className={slot.is_available ? "text-success" : "text-danger"}>
                                {slot.is_available ? "Available" : "Blocked"}
                              </div>
                            )}
                          </div>
                          <div className="btn-group btn-group-sm">
                            {!slot.appointment_id && (
                              <button
                                className={`btn ${slot.is_available ? "btn-outline-warning" : "btn-outline-success"}`}
                                onClick={() => handleToggleAvailability(slot)}
                                disabled={updateTimeslotMutation.isPending}
                                title={slot.is_available ? "Block this slot" : "Make slot available"}
                              >
                                <i className={`fas ${slot.is_available ? "fa-ban" : "fa-check"}`}></i>
                              </button>
                            )}
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteSlot(slot.slot_id)}
                              disabled={deleteTimeslotMutation.isPending}
                              title="Delete this slot"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
