import React, { useState } from "react";
import { DashboardContainer } from "~/components/doctorDashboard/Containers";

interface ScheduleSlot {
  id: number;
  date: string;
  time: string;
  patientName: string;
  type: string;
  status: "scheduled" | "available" | "blocked";
}

export default function ManageSchedule() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    {
      id: 1,
      date: "2024-01-15",
      time: "09:00",
      patientName: "John Doe",
      type: "Consultation",
      status: "scheduled",
    },
    {
      id: 2,
      date: "2024-01-15",
      time: "10:00",
      patientName: "",
      type: "",
      status: "available",
    },
    {
      id: 3,
      date: "2024-01-15",
      time: "11:00",
      patientName: "Jane Smith",
      type: "Follow-up",
      status: "scheduled",
    },
    {
      id: 4,
      date: "2024-01-15",
      time: "14:00",
      patientName: "",
      type: "",
      status: "blocked",
    },
  ]);

  const [newSlot, setNewSlot] = useState({
    date: "",
    time: "",
    status: "available" as "available" | "blocked",
  });

  const addSlot = () => {
    if (newSlot.date && newSlot.time) {
      const slot: ScheduleSlot = {
        id: Date.now(),
        date: newSlot.date,
        time: newSlot.time,
        patientName: "",
        type: "",
        status: newSlot.status,
      };
      setScheduleSlots([...scheduleSlots, slot]);
      setNewSlot({ date: "", time: "", status: "available" });
    }
  };

  const removeSlot = (id: number) => {
    setScheduleSlots(scheduleSlots.filter((slot) => slot.id !== id));
  };

  const toggleSlotStatus = (id: number) => {
    setScheduleSlots(
      scheduleSlots.map((slot) =>
        slot.id === id
          ? {
              ...slot,
              status: slot.status === "available" ? "blocked" : "available",
            }
          : slot
      )
    );
  };

  const filteredSlots = scheduleSlots.filter(
    (slot) => slot.date === selectedDate
  );

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
              <h5 className="mb-0">Add Time Slot</h5>
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
              <div className="mb-3">
                <label htmlFor="slotTime" className="form-label">
                  Time
                </label>
                <input
                  type="time"
                  className="form-control"
                  id="slotTime"
                  value={newSlot.time}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, time: e.target.value })
                  }
                />
              </div>
              <div className="mb-3">
                <label htmlFor="slotStatus" className="form-label">
                  Status
                </label>
                <select
                  className="form-select"
                  id="slotStatus"
                  value={newSlot.status}
                  onChange={(e) =>
                    setNewSlot({
                      ...newSlot,
                      status: e.target.value as "available" | "blocked",
                    })
                  }
                >
                  <option value="available">Available</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <button className="btn btn-primary w-100" onClick={addSlot}>
                <i className="fas fa-plus me-2"></i>
                Add Slot
              </button>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary">
                  <i className="fas fa-download me-2"></i>
                  Export Schedule
                </button>
                <button className="btn btn-outline-success">
                  <i className="fas fa-sync me-2"></i>
                  Sync Calendar
                </button>
                <button className="btn btn-outline-warning">
                  <i className="fas fa-clock me-2"></i>
                  Set Availability
                </button>
              </div>
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
              {filteredSlots.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No appointments scheduled for this date.
                </p>
              ) : (
                <div className="schedule-slots">
                  {filteredSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`d-flex justify-content-between align-items-center p-3 mb-2 rounded ${
                        slot.status === "scheduled"
                          ? "bg-primary bg-opacity-10 border border-primary"
                          : slot.status === "blocked"
                          ? "bg-danger bg-opacity-10 border border-danger"
                          : "bg-success bg-opacity-10 border border-success"
                      }`}
                    >
                      <div>
                        <strong>{slot.time}</strong>
                        {slot.patientName && (
                          <div className="text-muted">
                            {slot.patientName} - {slot.type}
                          </div>
                        )}
                        {slot.status === "available" && (
                          <div className="text-success">Available</div>
                        )}
                        {slot.status === "blocked" && (
                          <div className="text-danger">Blocked</div>
                        )}
                      </div>
                      <div className="btn-group btn-group-sm">
                        {slot.status === "available" && (
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => toggleSlotStatus(slot.id)}
                          >
                            <i className="fas fa-ban"></i>
                          </button>
                        )}
                        {slot.status === "blocked" && (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => toggleSlotStatus(slot.id)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => removeSlot(slot.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
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
