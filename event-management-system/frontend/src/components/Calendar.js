import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { eventsAPI } from '../services/api';
import EventDetail from './EventDetail';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

const localizer = momentLocalizer(moment);

const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('month');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getEvents({ upcoming: true });
      const eventsData = response.data.data.events;
      setEvents(eventsData);

      // Transform events for calendar
      const transformed = eventsData.map(event => ({
        id: event._id,
        title: event.title,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        resource: event,
        status: event.status,
        category: event.category
      }));

      setCalendarEvents(transformed);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events:', error);
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event.id);
  };

  const handleSelectSlot = ({ start, end }) => {
    // Open create event modal (to be implemented)
    console.log('Selected slot:', start, end);
  };

  const eventStyleGetter = (event) => {
    const categoryColors = {
      sports: '#3b82f6',
      academic: '#8b5cf6',
      cultural: '#ec4899',
      social: '#10b981',
      workshop: '#f59e0b',
      competition: '#ef4444',
      meeting: '#6366f1',
      other: '#6b7280'
    };

    const backgroundColor = categoryColors[event.category] || '#6b7280';

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>📅 Event Calendar</h2>
        <div className="calendar-legend">
          <span className="legend-item" style={{ backgroundColor: '#3b82f6' }}>Sports</span>
          <span className="legend-item" style={{ backgroundColor: '#8b5cf6' }}>Academic</span>
          <span className="legend-item" style={{ backgroundColor: '#ec4899' }}>Cultural</span>
          <span className="legend-item" style={{ backgroundColor: '#10b981' }}>Social</span>
          <span className="legend-item" style={{ backgroundColor: '#f59e0b' }}>Workshop</span>
        </div>
      </div>

      <BigCalendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        view={view}
        onView={setView}
        eventPropGetter={eventStyleGetter}
        popup
        views={['month', 'week', 'day', 'agenda']}
        tooltipAccessor={(event) => `${event.title} - ${event.category}`}
      />

      {selectedEvent && (
        <EventDetail 
          eventId={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
};

export default EventCalendar;
