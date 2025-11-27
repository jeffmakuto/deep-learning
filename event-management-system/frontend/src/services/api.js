import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  addFCMToken: (token, device) => api.post('/auth/fcm-token', { token, device }),
  removeFCMToken: (token) => api.delete('/auth/fcm-token', { data: { token } })
};

// Events
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  rsvp: (id, status) => api.post(`/events/${id}/rsvp`, { status }),
  cancelRSVP: (id) => api.delete(`/events/${id}/rsvp`),
  sendLiveUpdate: (id, data) => api.post(`/events/${id}/live-update`, data),
  updateScore: (id, team1Score, team2Score) => api.post(`/events/${id}/score`, { team1Score, team2Score }),
  checkIn: (id) => api.post(`/events/${id}/check-in`),
  getMyOrganized: () => api.get('/events/my/organized'),
  getMyAttending: () => api.get('/events/my/attending')
};

// Notifications
export const notificationsAPI = {
  send: (data) => api.post('/notifications/send', data),
  sendEventReminder: (eventId) => api.post(`/notifications/event-reminder/${eventId}`),
  broadcast: (data) => api.post('/notifications/broadcast', data)
};

export default api;
