# 🎓 Real-Time Event Management System

A comprehensive event management platform designed for schools and educational institutions, featuring real-time updates, live event tracking, push notifications, and calendar integration.

## ✨ Features

### Core Functionality
- **📅 Calendar Integration** - Visual calendar with multiple views (month, week, day, agenda)
- **📡 Live Event Tracking** - Real-time updates for ongoing sports, academic, and cultural events
- **🔔 Push Notifications** - Instant updates via Firebase Cloud Messaging
- **✅ RSVP System** - Event registration with capacity management
- **📊 Live Dashboard** - Monitor multiple live events simultaneously
- **🏆 Live Scoring** - Real-time score tracking for sports events
- **📱 Multi-Device Support** - Seamless experience across desktop, tablet, and mobile
- **👥 User Roles** - Student, Teacher, Admin, and Organizer roles with different permissions

### Real-Time Features
- **WebSocket Communication** - Instant bidirectional updates via Socket.IO
- **Firebase Realtime Database** - Data persistence and cross-device synchronization
- **Event Rooms** - Efficient targeted broadcasting to event participants
- **Live Feed** - Chronological updates with timestamps and author information
- **Viewer Count** - Track how many users are watching live events
- **Auto-Reconnection** - Resilient connection handling with automatic retry

### Event Categories
- 🏃 Sports Events
- 📚 Academic Events
- 🎭 Cultural Events
- 🤝 Social Events
- 🔬 Workshops
- 🏅 Competitions
- 💼 Meetings
- 📌 Other

## 🏗 Architecture

### Technology Stack

#### Backend
- **Node.js + Express** - RESTful API server
- **Socket.IO** - WebSocket real-time communication
- **MongoDB + Mongoose** - Database with ODM
- **Firebase Admin SDK** - Push notifications and Realtime Database
- **JWT** - Stateless authentication
- **bcrypt** - Password hashing
- **node-cron** - Scheduled event reminders

#### Frontend
- **React 18** - Component-based UI
- **Socket.IO Client** - WebSocket client
- **Firebase SDK** - FCM and Realtime Database
- **React Router** - Client-side routing
- **React Big Calendar** - Calendar component
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling
- **React Toastify** - Toast notifications

### Real-Time Architecture

```
User Browser                Server                  Firebase
    |                         |                        |
    |--WebSocket Connect----->|                        |
    |<--Connection OK---------|                        |
    |                         |                        |
    |--Join Event Room------->|                        |
    |                         |--Store Update--------->|
    |<--Live Update-----------|                        |
    |<--Firebase Sync---------|-----Broadcast-------->|
    |                         |                        |
    |--RSVP Update----------->|                        |
    |                         |--Persist Data--------->|
    |<--Confirmation----------|<--Sync Confirmation----|
```

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+
- Firebase project with Realtime Database and Cloud Messaging enabled

### Backend Setup

1. **Navigate to backend directory**
```powershell
cd event-management-system\backend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Configure environment variables**
```powershell
Copy-Item .env.example .env
```

Edit `.env` and add your configuration:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/event-management

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-this
JWT_EXPIRE=30d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# CORS
CLIENT_URL=http://localhost:3000
```

4. **Start MongoDB**
```powershell
# If MongoDB is installed as service, it should already be running
# Otherwise start it manually:
mongod --dbpath C:\data\db
```

5. **Run the backend server**
```powershell
npm start
```

Server should start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
```powershell
cd ..\frontend
```

2. **Install dependencies**
```powershell
npm install
```

3. **Configure environment variables**
```powershell
Copy-Item .env.example .env
```

Edit `.env` and add your Firebase configuration:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Firebase Configuration (from Firebase Console)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABC123
REACT_APP_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
REACT_APP_FIREBASE_VAPID_KEY=your-vapid-key
```

4. **Run the frontend development server**
```powershell
npm start
```

Frontend should open at `http://localhost:3000`

## 🚀 Usage

### Creating an Account
1. Navigate to the registration page
2. Fill in your details (name, email, password, role)
3. Submit to create your account
4. Login with your credentials

### Viewing Events
- **Calendar View** - Click on the calendar icon to see events in calendar format
- **List View** - Browse events in list format with filters
- **Live Dashboard** - View all ongoing live events

### RSVP to Events
1. Open any event detail
2. Click "Going", "Maybe", or "Not Going"
3. Receive confirmation and event updates

### Following Live Events
1. Navigate to Live Dashboard
2. Click on any live event
3. Watch real-time updates and scores
4. RSVP or check-in to the event

### Creating Events (Organizer/Admin)
1. Click "Create Event" button
2. Fill in event details:
   - Title, description, category
   - Start and end dates
   - Location (venue, room, address)
   - Capacity and RSVP settings
   - Enable live tracking for real-time updates
3. Submit to create the event

### Managing Live Events (Organizer)
1. Open your event from "My Events"
2. Click "Go Live" to start live tracking
3. Post live updates during the event
4. Update scores for sports events
5. End the event when finished

## 📡 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@school.edu",
  "password": "securepassword",
  "role": "student",
  "department": "Computer Science"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@school.edu",
  "password": "securepassword"
}

Response:
{
  "token": "jwt-token-here",
  "user": { ... }
}
```

### Events

#### Get All Events
```http
GET /api/events?category=sports&status=upcoming&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Single Event
```http
GET /api/events/:id
Authorization: Bearer <token>
```

#### Create Event
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Basketball Championship",
  "description": "Annual inter-departmental basketball tournament",
  "category": "sports",
  "startDate": "2024-02-15T14:00:00Z",
  "endDate": "2024-02-15T18:00:00Z",
  "location": {
    "venue": "Main Sports Hall",
    "room": "Court 1"
  },
  "capacity": 200,
  "liveTracking": {
    "enabled": true
  }
}
```

#### RSVP to Event
```http
POST /api/events/:id/rsvp
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "going"  // or "maybe" or "not-going"
}
```

#### Post Live Update
```http
POST /api/events/:id/live-update
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Half-time! Score is 45-42",
  "type": "score"  // or "update", "announcement", "alert"
}
```

#### Update Score
```http
POST /api/events/:id/score
Authorization: Bearer <token>
Content-Type: application/json

{
  "team1Score": 78,
  "team2Score": 72
}
```

### WebSocket Events

#### Client → Server

```javascript
// Join event room
socket.emit('event:join', eventId);

// Leave event room
socket.emit('event:leave', eventId);

// Send live update (organizers only)
socket.emit('event:update', {
  eventId: 'event-id',
  message: 'Update message',
  type: 'update'
});

// Update score (organizers only)
socket.emit('event:score-update', {
  eventId: 'event-id',
  score: { team1: 45, team2: 42 }
});

// RSVP update
socket.emit('event:rsvp', {
  eventId: 'event-id',
  userId: 'user-id',
  status: 'going'
});
```

#### Server → Client

```javascript
// Live update received
socket.on('event:live-update', (data) => {
  console.log(data.update);
  // { message: '...', author: '...', timestamp: ..., type: '...' }
});

// Score changed
socket.on('event:score-change', (data) => {
  console.log(data.score);
  // { team1: { name: '...', score: 45 }, team2: { ... } }
});

// RSVP updated
socket.on('event:rsvp-update', (data) => {
  console.log(data.attendeeCount);
});

// Viewer count
socket.on('event:viewers', (count) => {
  console.log(`${count} viewers watching`);
});

// Notification
socket.on('notification', (notification) => {
  console.log(notification);
});
```

## 🔐 Security

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Stateless token-based auth
- **Role-Based Access Control** - Different permissions for different roles
- **Input Validation** - Mongoose schema validation
- **CORS Protection** - Configured allowed origins
- **Environment Variables** - Sensitive data not committed to repo

## 📊 Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: Enum ['student', 'teacher', 'admin', 'organizer'],
  avatar: String (URL),
  phone: String,
  department: String,
  grade: String,
  preferences: {
    notifications: { email, push, sms },
    eventCategories: [String]
  },
  fcmTokens: [{ token, device, addedAt }],
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model
```javascript
{
  title: String (required),
  description: String,
  category: Enum ['sports', 'academic', 'cultural', ...],
  startDate: Date (required),
  endDate: Date (required),
  status: Enum ['upcoming', 'ongoing', 'completed', 'cancelled'],
  location: { venue, room, building, address, coordinates },
  organizer: { userId, name, email, phone },
  capacity: Number,
  liveTracking: {
    enabled: Boolean,
    currentStatus: String,
    updates: [{ message, author, timestamp, type }],
    score: { team1: {name, score}, team2: {name, score} }
  },
  rsvp: {
    required: Boolean,
    deadline: Date,
    attendees: [{ userId, status, respondedAt }]
  },
  analytics: {
    views: Number,
    uniqueVisitors: [String],
    totalRSVPs: Number,
    checkIns: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🎯 Future Enhancements

- [ ] Email notifications for event reminders
- [ ] QR code check-in system
- [ ] Event feedback and ratings
- [ ] Image/video upload for events
- [ ] Integration with school management systems
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Export calendar to iCal/Google Calendar
- [ ] Multi-language support
- [ ] Dark mode theme

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Check that backend server is running on correct port
- Verify `REACT_APP_SOCKET_URL` in frontend `.env`
- Check browser console for connection errors
- Ensure no firewall blocking WebSocket connections

### Firebase Not Working
- Verify all Firebase environment variables are set correctly
- Check Firebase project settings and enable Realtime Database
- Ensure FCM is enabled in Firebase Console
- Verify VAPID key is correct for web push

### MongoDB Connection Failed
- Ensure MongoDB service is running
- Check `MONGODB_URI` in backend `.env`
- Verify database permissions
- Check MongoDB logs for errors

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Development

### Project Structure
```
event-management-system/
├── backend/
│   ├── config/          # Firebase, database configs
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   └── server.js        # Main server file
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # React components
│       ├── services/    # API, Socket, Firebase services
│       └── App.js       # Main app component
└── README.md
```

### Running Tests
```powershell
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```powershell
# Build frontend
cd frontend
npm run build

# Serve with backend
cd ..\backend
$env:NODE_ENV="production"
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.

---

**Built with ❤️ for educational institutions**
