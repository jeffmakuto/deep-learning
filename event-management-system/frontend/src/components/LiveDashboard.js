import React, { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { dbListen } from '../services/firebase';
import { eventsAPI } from '../services/api';
import { toast } from 'react-toastify';
import moment from 'moment';
import './LiveDashboard.css';

const LiveDashboard = () => {
  const [liveEvents, setLiveEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [viewers, setViewers] = useState({});

  useEffect(() => {
    loadLiveEvents();
    setupRealtimeListeners();

    return () => {
      // Cleanup
      liveEvents.forEach(event => {
        socketService.leaveEventRoom(event._id);
      });
    };
  }, []);

  const loadLiveEvents = async () => {
    try {
      const response = await eventsAPI.getEvents({ status: 'ongoing' });
      const events = response.data.data.events.filter(e => e.liveTracking?.enabled);
      setLiveEvents(events);

      if (events.length > 0) {
        selectEvent(events[0]);
      }
    } catch (error) {
      console.error('Error loading live events:', error);
    }
  };

  const selectEvent = (event) => {
    // Leave previous event room
    if (selectedEvent) {
      socketService.leaveEventRoom(selectedEvent._id);
    }

    setSelectedEvent(event);
    socketService.joinEventRoom(event._id);

    // Load historical updates from Firebase
    const unsubscribe = dbListen(`events/${event._id}/liveUpdates`, (updates) => {
      if (updates) {
        const updateArray = Object.values(updates)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 20);
        setLiveUpdates(updateArray);
      }
    });

    return unsubscribe;
  };

  const setupRealtimeListeners = () => {
    // Listen for live updates
    socketService.on('event:live-update', (data) => {
      if (selectedEvent && data.eventId === selectedEvent._id) {
        setLiveUpdates(prev => [data.update, ...prev].slice(0, 20));
        
        // Show toast notification
        toast.info(data.update.message, {
          position: 'top-right',
          autoClose: 3000
        });
      }
    });

    // Listen for score changes
    socketService.on('event:score-change', (data) => {
      if (selectedEvent && data.eventId === selectedEvent._id) {
        setSelectedEvent(prev => ({
          ...prev,
          liveTracking: {
            ...prev.liveTracking,
            score: data.score
          }
        }));
      }
    });

    // Listen for viewer count
    socketService.on('event:viewers', (count) => {
      if (selectedEvent) {
        setViewers(prev => ({
          ...prev,
          [selectedEvent._id]: count
        }));
      }
    });
  };

  if (liveEvents.length === 0) {
    return (
      <div className="live-dashboard-empty">
        <h2>📡 No Live Events</h2>
        <p>There are no ongoing events with live tracking at the moment.</p>
      </div>
    );
  }

  return (
    <div className="live-dashboard">
      <div className="dashboard-header">
        <h1>📡 Live Events Dashboard</h1>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>{liveEvents.length} Event{liveEvents.length !== 1 ? 's' : ''} Live</span>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="event-tabs">
          {liveEvents.map(event => (
            <button
              key={event._id}
              className={`event-tab ${selectedEvent?._id === event._id ? 'active' : ''}`}
              onClick={() => selectEvent(event)}
            >
              <div className="tab-title">{event.title}</div>
              <div className="tab-category">{event.category}</div>
              {viewers[event._id] > 0 && (
                <div className="tab-viewers">👁 {viewers[event._id]}</div>
              )}
            </button>
          ))}
        </div>

        {selectedEvent && (
          <div className="dashboard-main">
            <div className="event-info-panel">
              <h2>{selectedEvent.title}</h2>
              <div className="event-meta-row">
                <span className="meta-item">
                  📍 {selectedEvent.location.venue}
                </span>
                <span className="meta-item">
                  ⏰ {moment(selectedEvent.startDate).format('h:mm A')}
                </span>
                <span className="meta-item">
                  👥 {selectedEvent.attendeeCount || 0} attending
                </span>
              </div>

              {selectedEvent.category === 'sports' && selectedEvent.liveTracking?.score && (
                <div className="scoreboard-widget">
                  <h3>🏆 Live Score</h3>
                  <div className="score-container">
                    <div className="team-score">
                      <div className="team-name">{selectedEvent.liveTracking.score.team1.name}</div>
                      <div className="score-value">{selectedEvent.liveTracking.score.team1.score}</div>
                    </div>
                    <div className="score-divider">-</div>
                    <div className="team-score">
                      <div className="team-name">{selectedEvent.liveTracking.score.team2.name}</div>
                      <div className="score-value">{selectedEvent.liveTracking.score.team2.score}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="live-feed-panel">
              <div className="feed-header">
                <h3>📋 Live Feed</h3>
                <div className="viewer-count">
                  {viewers[selectedEvent._id] || 0} watching
                </div>
              </div>

              <div className="live-feed">
                {liveUpdates.length === 0 ? (
                  <div className="no-updates">
                    <p>Waiting for updates...</p>
                  </div>
                ) : (
                  liveUpdates.map((update, index) => (
                    <div key={index} className={`feed-item ${update.type}`}>
                      <div className="feed-timestamp">
                        {moment(update.timestamp).format('HH:mm:ss')}
                      </div>
                      <div className="feed-content">
                        <div className="feed-author">{update.author}</div>
                        <div className="feed-message">{update.message}</div>
                      </div>
                      <div className={`feed-type-badge ${update.type}`}>
                        {update.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveDashboard;
