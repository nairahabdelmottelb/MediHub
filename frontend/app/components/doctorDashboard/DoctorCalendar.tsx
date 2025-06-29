import React, { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Link } from "react-router";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { DashboardContainer } from "./Containers";
import { useCurrentDoctor } from "~/api/queries/useCurrentDoctor";
import { useCreateTimeslot, useDoctorTimeslots, useCreateDoctorCalendar } from "~/api/queries/useTimeslots";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  patientName?: string;
  type: "appointment" | "break" | "unavailable";
}

const DoctorCalendar: React.FC = () => {
  const { data: currentDoctor, isLoading: doctorLoading } = useCurrentDoctor();
  const { data: timeslots, isLoading: timeslotsLoading, refetch: refetchTimeslots } = useDoctorTimeslots(
    currentDoctor?.doctor_id || 0
  );
  const createTimeslotMutation = useCreateTimeslot();
  const createCalendarMutation = useCreateDoctorCalendar();

  // Check if doctor needs a calendar
  const needsCalendar = currentDoctor && !currentDoctor.calendar;

  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: "Appointment with John Doe",
      start: new Date(2024, 3, 1, 10, 0),
      end: new Date(2024, 3, 1, 10, 30),
      patientName: "John Doe",
      type: "appointment",
    },
    {
      id: 2,
      title: "Lunch Break",
      start: new Date(2024, 3, 1, 12, 0),
      end: new Date(2024, 3, 1, 13, 0),
      type: "break",
    },
  ]);

  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // Modal states
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  // Form states
  const [breakForm, setBreakForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    title: "Break",
  });

  const [unavailableForm, setUnavailableForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
  });

  // Alert states
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Clear alert after 5 seconds
  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    // Pre-fill forms with selected slot if available
    const selectedDate = format(slotInfo.start, "yyyy-MM-dd");
    const startTime = format(slotInfo.start, "HH:mm");
    const endTime = format(slotInfo.end, "HH:mm");

    setBreakForm(prev => ({
      ...prev,
      date: selectedDate,
      startTime,
      endTime,
    }));

    setUnavailableForm(prev => ({
      ...prev,
      date: selectedDate,
      startTime,
      endTime,
    }));
  };

  const handleAddBreak = async () => {
    if (!currentDoctor?.calendar?.calendar_id) {
      showAlert("error", "Calendar not found. Please contact support.");
      return;
    }

    if (!breakForm.date || !breakForm.startTime || !breakForm.endTime) {
      showAlert("error", "Please fill in all required fields.");
      return;
    }

    try {
      const startDateTime = `${breakForm.date}T${breakForm.startTime}:00`;
      const endDateTime = `${breakForm.date}T${breakForm.endTime}:00`;

      await createTimeslotMutation.mutateAsync({
        calendar_id: currentDoctor.calendar.calendar_id,
        start_time: startDateTime,
        end_time: endDateTime,
        is_available: false, // Break slots are not available for booking
      });

      showAlert("success", "Break added successfully!");
      setShowBreakModal(false);
      setBreakForm({ date: "", startTime: "", endTime: "", title: "Break" });
      refetchTimeslots();
    } catch (error: any) {
      console.error("Error adding break:", error);
      showAlert("error", error.response?.data?.detail || "Failed to add break. Please try again.");
    }
  };

  const handleMarkUnavailable = async () => {
    if (!currentDoctor?.calendar?.calendar_id) {
      showAlert("error", "Calendar not found. Please contact support.");
      return;
    }

    if (!unavailableForm.date || !unavailableForm.startTime || !unavailableForm.endTime) {
      showAlert("error", "Please fill in all required fields.");
      return;
    }

    try {
      const startDateTime = `${unavailableForm.date}T${unavailableForm.startTime}:00`;
      const endDateTime = `${unavailableForm.date}T${unavailableForm.endTime}:00`;

      await createTimeslotMutation.mutateAsync({
        calendar_id: currentDoctor.calendar.calendar_id,
        start_time: startDateTime,
        end_time: endDateTime,
        is_available: false, // Unavailable slots are not available for booking
      });

      showAlert("success", "Time slot marked as unavailable!");
      setShowUnavailableModal(false);
      setUnavailableForm({ date: "", startTime: "", endTime: "", reason: "" });
      refetchTimeslots();
    } catch (error: any) {
      console.error("Error marking unavailable:", error);
      showAlert("error", error.response?.data?.detail || "Failed to mark time slot as unavailable. Please try again.");
    }
  };

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = "#3174ad";
    if (event.type === "break") {
      backgroundColor = "#ff9800";
    } else if (event.type === "unavailable") {
      backgroundColor = "#f44336";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
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
    <>
      <div className="row">
        <div className="col-md-9">
          <DashboardContainer>
            <h4>
              <i className="fas fa-calendar-alt me-2" />
              Schedule Management
            </h4>

            {/* Alert */}
            {alert && (
              <div className={`alert alert-${alert.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                <i className={`fas fa-${alert.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                {alert.message}
                <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
              </div>
            )}

            <div style={{ height: "600px" }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                selectable
                onSelectSlot={handleSelectSlot}
                eventPropGetter={eventStyleGetter}
                defaultView="week"
                views={["day", "week", "month"]}
                min={new Date(0, 0, 0, 8, 0, 0)}
                max={new Date(0, 0, 0, 18, 0, 0)}
              />
            </div>
          </DashboardContainer>
        </div>
        <div className="col-md-3">
          <DashboardContainer>
            <h4>
              <i className="fas fa-plus-circle me-2" />
              Quick Actions
            </h4>
            <div className="d-grid gap-2">
              <Link to="/doctor/newAppointment" className="btn btn-primary">
                <i className="fas fa-plus me-2" />
                Add Appointment
              </Link>
              <button
                className="btn btn-warning"
                onClick={() => setShowBreakModal(true)}
                disabled={createTimeslotMutation.isPending}
              >
                <i className="fas fa-coffee me-2" />
                Add Break
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowUnavailableModal(true)}
                disabled={createTimeslotMutation.isPending}
              >
                <i className="fas fa-ban me-2" />
                Mark as Unavailable
              </button>
            </div>
            {selectedSlot && (
              <div className="mt-4">
                <h5>Selected Time Slot</h5>
                <p>
                  Start: {format(selectedSlot.start, "PPp")}
                  <br />
                  End: {format(selectedSlot.end, "PPp")}
                </p>
              </div>
            )}
          </DashboardContainer>
        </div>
      </div>

      {/* Add Break Modal */}
      <div className={`modal fade ${showBreakModal ? 'show' : ''}`} style={{ display: showBreakModal ? 'block' : 'none' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-coffee me-2"></i>
                Add Break
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowBreakModal(false)}></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="breakTitle" className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="breakTitle"
                    value={breakForm.title}
                    onChange={(e) => setBreakForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Lunch Break, Coffee Break"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="breakDate" className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="breakDate"
                    value={breakForm.date}
                    onChange={(e) => setBreakForm(prev => ({ ...prev, date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="breakStartTime" className="form-label">Start Time *</label>
                      <input
                        type="time"
                        className="form-control"
                        id="breakStartTime"
                        value={breakForm.startTime}
                        onChange={(e) => setBreakForm(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="breakEndTime" className="form-label">End Time *</label>
                      <input
                        type="time"
                        className="form-control"
                        id="breakEndTime"
                        value={breakForm.endTime}
                        onChange={(e) => setBreakForm(prev => ({ ...prev, endTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBreakModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleAddBreak}
                disabled={createTimeslotMutation.isPending}
              >
                {createTimeslotMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Adding...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Add Break
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Unavailable Modal */}
      <div className={`modal fade ${showUnavailableModal ? 'show' : ''}`} style={{ display: showUnavailableModal ? 'block' : 'none' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-ban me-2"></i>
                Mark Time as Unavailable
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowUnavailableModal(false)}></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="unavailableReason" className="form-label">Reason (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="unavailableReason"
                    value={unavailableForm.reason}
                    onChange={(e) => setUnavailableForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Personal appointment, Out of office"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="unavailableDate" className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    id="unavailableDate"
                    value={unavailableForm.date}
                    onChange={(e) => setUnavailableForm(prev => ({ ...prev, date: e.target.value }))}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="unavailableStartTime" className="form-label">Start Time *</label>
                      <input
                        type="time"
                        className="form-control"
                        id="unavailableStartTime"
                        value={unavailableForm.startTime}
                        onChange={(e) => setUnavailableForm(prev => ({ ...prev, startTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="unavailableEndTime" className="form-label">End Time *</label>
                      <input
                        type="time"
                        className="form-control"
                        id="unavailableEndTime"
                        value={unavailableForm.endTime}
                        onChange={(e) => setUnavailableForm(prev => ({ ...prev, endTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowUnavailableModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleMarkUnavailable}
                disabled={createTimeslotMutation.isPending}
              >
                {createTimeslotMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Marking...
                  </>
                ) : (
                  <>
                    <i className="fas fa-ban me-2"></i>
                    Mark Unavailable
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal backdrops */}
      {(showBreakModal || showUnavailableModal) && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  );
};

export default DoctorCalendar;
