import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect(userData) {
    if (this.socket && this.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✓ Socket connected:', this.socket.id);
      this.connected = true;
      
      // Send user data to server
      if (userData) {
        this.socket.emit('user:join', userData);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('Socket disconnected manually');
    }
  }

  // Event room methods
  joinEventRoom(eventId) {
    if (this.socket && this.connected) {
      this.socket.emit('event:join', eventId);
      console.log(`Joined event room: ${eventId}`);
    }
  }

  leaveEventRoom(eventId) {
    if (this.socket && this.connected) {
      this.socket.emit('event:leave', eventId);
      console.log(`Left event room: ${eventId}`);
    }
  }

  // Send live update
  sendLiveUpdate(eventId, update) {
    if (this.socket && this.connected) {
      this.socket.emit('event:update', { eventId, update });
    }
  }

  // Send score update
  sendScoreUpdate(eventId, score) {
    if (this.socket && this.connected) {
      this.socket.emit('event:score-update', { eventId, score });
    }
  }

  // Send RSVP
  sendRSVP(eventId, userId, status) {
    if (this.socket && this.connected) {
      this.socket.emit('event:rsvp', { eventId, userId, status });
    }
  }

  // Send typing indicator
  sendTyping(eventId, userName, isTyping) {
    if (this.socket && this.connected) {
      this.socket.emit('event:typing', { eventId, userName, isTyping });
    }
  }

  // Send notification
  sendNotification(userIds, notification) {
    if (this.socket && this.connected) {
      this.socket.emit('notification:send', { userIds, notification });
    }
  }

  // Broadcast notification
  broadcastNotification(notification) {
    if (this.socket && this.connected) {
      this.socket.emit('notification:broadcast', notification);
    }
  }

  // Listen to events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
