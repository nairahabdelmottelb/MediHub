import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DashboardContainer } from './Containers';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  patientName?: string;
  type: 'appointment' | 'break' | 'unavailable';
}

const DoctorCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: 'Appointment with John Doe',
      start: new Date(2024, 3, 1, 10, 0),
      end: new Date(2024, 3, 1, 10, 30),
      patientName: 'John Doe',
      type: 'appointment',
    },
    {
      id: 2,
      title: 'Lunch Break',
      start: new Date(2024, 3, 1, 12, 0),
      end: new Date(2024, 3, 1, 13, 0),
      type: 'break',
    },
  ]);

  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
  };

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = '#3174ad';
    if (event.type === 'break') {
      backgroundColor = '#ff9800';
    } else if (event.type === 'unavailable') {
      backgroundColor = '#f44336';
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div className="row">
      <div className="col-md-9">
        <DashboardContainer>
          <h4>
            <i className="fas fa-calendar-alt me-2" />
            Schedule Management
          </h4>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              selectable
              onSelectSlot={handleSelectSlot}
              eventPropGetter={eventStyleGetter}
              defaultView="week"
              views={['day', 'week', 'month']}
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
            <button className="btn btn-primary">
              <i className="fas fa-plus me-2" />
              Add Appointment
            </button>
            <button className="btn btn-warning">
              <i className="fas fa-coffee me-2" />
              Add Break
            </button>
            <button className="btn btn-danger">
              <i className="fas fa-ban me-2" />
              Mark as Unavailable
            </button>
          </div>
          {selectedSlot && (
            <div className="mt-4">
              <h5>Selected Time Slot</h5>
              <p>
                Start: {format(selectedSlot.start, 'PPp')}
                <br />
                End: {format(selectedSlot.end, 'PPp')}
              </p>
            </div>
          )}
        </DashboardContainer>
      </div>
    </div>
  );
};

export default DoctorCalendar; 