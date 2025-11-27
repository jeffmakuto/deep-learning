import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';
import socketService from '../services/socketService';
import { dbListen } from '../services/firebase';
import { toast } from 'react-toastify';
import moment from 'moment';
import './EventDetail.css';

const EventDetail = ({ eventId, onClose }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [rsvpStatus, setRsvpStatus] = useState(null);

  useEffect(() => {
    loadEvent();
    joinEventRoom();

    // Cleanup
    return () => {
      if (eventId) {
        socketService.leaveEventRoom(eventId);
      }
    };
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const response = await eventsAPI.getEvent(eventId);
      setEvent(response.data.data.event);
      
      // Check user's RSVP status
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && response.data.data.event.rsvp.attendees) {
        const userRSVP = response.data.data.event.rsvp.attendees.find(
          a => a.userId === user.id
        );
        if (userRSVP) {
          setRsvpStatus(userRSVP.status);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event');
      setLoading(false);
    }
  };

  const joinEventRoom = () => {
    socketService.joinEventRoom(eventId);

    // Listen for live updates
    socketService.on('event:live-update', (data) => {
      if (data.eventId === eventId) {
        setLiveUpdates(prev => [data.update, ...prev].slice(0, 50)); // Keep last 50 updates
        toast.info(data.update.message, { autoClose: 3000 });
      }
    });

    // Listen for score changes
    socketService.on('event:score-change', (data) => {
      if (data.eventId === eventId) {
        setEvent(prev => ({
          ...prev,
          liveTracking: {
            ...prev.liveTracking,
            score: data.score
          }
        }));
      }
    });

    // Listen for RSVP updates
    socketService.on('event:rsvp-update', (data) => {
      if (data.eventId === eventId) {
        setEvent(prev => ({
          ...prev,
          attendeeCount: data.totalAttendees
        }));
      }
    });

    // Listen for viewer count
    socketService.on('event:viewers', (count) => {
      setViewers(count);
    });

    // Listen to Firebase for historical updates
    const unsubscribe = dbListen(`events/${eventId}/liveUpdates`, (updates) => {
      if (updates) {
        const updateArray = Object.values(updates).sort((a, b) => b.timestamp - a.timestamp);
        setLiveUpdates(updateArray.slice(0, 50));
      }
    });

    return unsubscribe;
  };

  const handleRSVP = async (status) => {
    try {
      await eventsAPI.rsvp(eventId, status);
      setRsvpStatus(status);
      toast.success(`RSVP status updated to: ${status}`);
      loadEvent(); // Reload to get updated attendee count
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error(error.response?.data?.message || 'Failed to update RSVP');
    }
  };

  const handleCancelRSVP = async () => {
    try {
      await eventsAPI.cancelRSVP(eventId);
      setRsvpStatus(null);
      toast.success('RSVP cancelled');
      loadEvent();
    } catch (error) {
      console.error('Error cancelling RSVP:', error);
      toast.error('Failed to cancel RSVP');
    }
  };

  const handleCheckIn = async () => {
    try {
      await eventsAPI.checkIn(eventId);
      toast.success('Checked in successfully!');
      loadEvent();
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error(error.response?.data?.message || 'Failed to check in');
    }
  };

  if (loading) {
    return (
      <div className="event-detail-loading">
        <div className="spinner"></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-error">
        <p>Event not found</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  const isLive = event.status === 'ongoing' && event.liveTracking?.enabled;
  const isSportsEvent = event.category === 'sports';

  return (
    <div className="event-detail-modal">
      <div className="event-detail-container">
        <div className="event-detail-header">
          <div>
            <h1>{event.title}</h1>
            <div className="event-meta">
              <span className={`status-badge status-${event.status}`}>
                {event.status}
              </span>
              <span className="category-badge">{event.category}</span>
              {isLive && <span className="live-badge">🔴 LIVE</span>}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {event.imageUrl && (
          <div className="event-image">
            <img src={event.imageUrl} alt={event.title} />
          </div>
        )}

        <div className="event-detail-content">
          <div className="event-main">
            <section className="event-section">
              <h2>📋 Description</h2>
              <p>{event.description}</p>
            </section>

            <section className="event-section">
              <h2>📅 Event Details</h2>
              <div className="event-info-grid">
                <div className="info-item">
                  <strong>Start:</strong>
                  <span>{moment(event.startDate).format('MMMM D, YYYY h:mm A')}</span>
                </div>
                <div className="info-item">
                  <strong>End:</strong>
                  <span>{moment(event.endDate).format('MMMM D, YYYY h:mm A')}</span>
                </div>
                <div className="info-item">
                  <strong>Location:</strong>
                  <span>{event.location.venue}</span>
                </div>
                <div className="info-item">
                  <strong>Organizer:</strong>
                  <span>{event.organizer.name}</span>
                </div>
              </div>
            </section>

            {isSportsEvent && event.liveTracking?.score && (
              <section className="event-section scoreboard">
                <h2>🏆 Live Score</h2>
                <div className="score-display">
                  <div className="team">
                    <h3>{event.liveTracking.score.team1.name}</h3>
                    <div className="score">{event.liveTracking.score.team1.score}</div>
                  </div>
                  <div className="vs">VS</div>
                  <div className="team">
                    <h3>{event.liveTracking.score.team2.name}</h3>
                    <div className="score">{event.liveTracking.score.team2.score}</div>
                  </div>
                </div>
              </section>
            )}

            {isLive && (
              <section className="event-section live-updates">
                <h2>📡 Live Updates {viewers > 0 && `(${viewers} watching)`}</h2>
                <div className="updates-feed">
                  {liveUpdates.length === 0 ? (
                    <p className="no-updates">No updates yet</p>
                  ) : (
                    liveUpdates.map((update, index) => (
                      <div key={index} className={`update-item ${update.type}`}>
                        <div className="update-header">
                          <span className="update-author">{update.author}</span>
                          <span className="update-time">
                            {moment(update.timestamp).fromNow()}
                          </span>
                        </div>
                        <p className="update-message">{update.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            <section className="event-section">
              <h2>👥 Attendees ({event.attendeeCount || 0})</h2>
              {event.capacity && (
                <p>Available spots: {event.availableSpots}/{event.capacity}</p>
              )}
              
              <div className="rsvp-actions">
                {!rsvpStatus ? (
                  <>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleRSVP('going')}
                    >
                      ✓ Going
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleRSVP('maybe')}
                    >
                      ? Maybe
                    </button>
                  </>
                ) : (
                  <div className="rsvp-status">
                    <p>Your RSVP: <strong>{rsvpStatus}</strong></p>
                    <button 
                      className="btn btn-outline"
                      onClick={handleCancelRSVP}
                    >
                      Cancel RSVP
                    </button>
                    <button 
                      className="btn btn-primary"
                      onClick={handleCheckIn}
                    >
                      Check In
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="event-sidebar">
            <div className="sidebar-card">
              <h3>Event Info</h3>
              <div className="info-list">
                <div className="info-row">
                  <span>Status:</span>
                  <strong>{event.status}</strong>
                </div>
                <div className="info-row">
                  <span>Category:</span>
                  <strong>{event.category}</strong>
                </div>
                <div className="info-row">
                  <span>Visibility:</span>
                  <strong>{event.visibility}</strong>
                </div>
                <div className="info-row">
                  <span>Views:</span>
                  <strong>{event.analytics?.views || 0}</strong>
                </div>
              </div>
            </div>

            {event.tags && event.tags.length > 0 && (
              <div className="sidebar-card">
                <h3>Tags</h3>
                <div className="tags">
                  {event.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
