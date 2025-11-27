# 🚀 Complete Setup Guide

This guide will walk you through setting up the Event Management System from scratch.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 16 or higher installed ([Download](https://nodejs.org/))
- [ ] MongoDB installed and running ([Download](https://www.mongodb.com/try/download/community))
- [ ] Firebase account ([Create free account](https://firebase.google.com/))
- [ ] Git installed (optional, for cloning)
- [ ] Code editor (VS Code recommended)

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "school-event-management")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 1.2 Enable Realtime Database

1. In Firebase Console, click "Realtime Database" in left sidebar
2. Click "Create Database"
3. Choose location closest to your users
4. Start in **Test Mode** (we'll secure it later)
5. Click "Enable"

### 1.3 Enable Cloud Messaging

1. Click "Cloud Messaging" in left sidebar
2. Click the settings gear → "Project settings"
3. Go to "Cloud Messaging" tab
4. Note down your **Server Key** (for backend)
5. Under "Web Push certificates", generate a new key pair
6. Copy the **VAPID key** (for frontend)

### 1.4 Get Firebase Configuration

1. In Project Settings, scroll to "Your apps"
2. Click the **Web** icon (</>)
3. Register app with nickname (e.g., "web-app")
4. Copy the configuration object - you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "project.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc",
  databaseURL: "https://project.firebaseio.com",
  measurementId: "G-ABC123"
};
```

### 1.5 Generate Service Account Key (for Backend)

1. Go to Project Settings → "Service Accounts"
2. Click "Generate new private key"
3. Download the JSON file
4. Open the file and note these values:
   - `project_id`
   - `private_key`
   - `client_email`

## Step 2: MongoDB Setup

### 2.1 Install MongoDB (Windows)

1. Download MongoDB Community Server
2. Run the installer
3. Choose "Complete" installation
4. Install as a Windows Service (recommended)
5. Install MongoDB Compass (GUI tool)

### 2.2 Verify MongoDB is Running

```powershell
# Check if MongoDB service is running
Get-Service -Name MongoDB

# Or connect with mongo shell
mongo

# In mongo shell:
show dbs
exit
```

### 2.3 Create Database

MongoDB will create the database automatically when you first connect, but you can create it manually:

```powershell
mongo
use event-management
db.createCollection("users")
db.createCollection("events")
exit
```

## Step 3: Backend Setup

### 3.1 Navigate to Backend Directory

```powershell
cd event-management-system\backend
```

### 3.2 Install Dependencies

```powershell
npm install
```

You should see packages being installed:
- express
- socket.io
- mongoose
- firebase-admin
- jsonwebtoken
- bcryptjs
- and more...

### 3.3 Create Environment File

```powershell
Copy-Item .env.example .env
notepad .env
```

### 3.4 Configure Environment Variables

Edit `.env` with your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/event-management

# JWT Authentication
JWT_SECRET=my-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRE=30d

# Firebase Admin SDK (from Service Account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nMulti\nLine\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# CORS
CLIENT_URL=http://localhost:3000
```

**Important Notes:**
- Replace `your-project-id` with your Firebase project ID
- For `FIREBASE_PRIVATE_KEY`, copy the entire private key from the service account JSON, including the `\n` newline characters
- Keep the key wrapped in double quotes
- Replace `FIREBASE_CLIENT_EMAIL` with the client_email from service account JSON
- Change `JWT_SECRET` to a random secure string

### 3.5 Start Backend Server

```powershell
npm start
```

You should see:
```
MongoDB connected successfully
Server is running on port 5000
Socket.IO server is ready
```

### 3.6 Test Backend

Open another PowerShell terminal:

```powershell
# Test health endpoint
curl http://localhost:5000/api/health

# Should return: {"status":"OK","timestamp":"..."}
```

## Step 4: Frontend Setup

### 4.1 Open New Terminal and Navigate to Frontend

```powershell
# Open new PowerShell window
cd event-management-system\frontend
```

### 4.2 Install Dependencies

```powershell
npm install
```

This will install React and all frontend dependencies (~1-2 minutes).

### 4.3 Create Environment File

```powershell
Copy-Item .env.example .env
notepad .env
```

### 4.4 Configure Environment Variables

Edit `.env` with your Firebase configuration from Step 1.4:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Firebase Configuration (from Firebase Console)
REACT_APP_FIREBASE_API_KEY=AIza...your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABC123
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_VAPID_KEY=your-vapid-key-from-cloud-messaging
```

### 4.5 Start Frontend Development Server

```powershell
npm start
```

The app should automatically open in your browser at `http://localhost:3000`.

## Step 5: Verification

### 5.1 Check All Services

You should now have:
1. ✅ MongoDB running (localhost:27017)
2. ✅ Backend API running (localhost:5000)
3. ✅ Frontend React app (localhost:3000)
4. ✅ Firebase Realtime Database connected

### 5.2 Test Registration

1. Open browser to `http://localhost:3000`
2. Click "Register"
3. Fill in the form:
   - Name: Test User
   - Email: test@school.edu
   - Password: password123
   - Role: Student
4. Click "Register"
5. You should be logged in

### 5.3 Test Real-Time Features

1. Open two browser windows side-by-side
2. Login to both with the same or different accounts
3. Create an event in one window
4. Enable live tracking
5. Post a live update
6. Watch the update appear in the other window instantly

### 5.4 Test Push Notifications

1. When prompted, click "Allow" for notifications
2. Create a live event
3. Post an update
4. You should receive a browser notification

## Step 6: Database Security Rules (Production)

For production, update Firebase Realtime Database rules:

```json
{
  "rules": {
    "events": {
      "$eventId": {
        ".read": true,
        ".write": "auth != null",
        "liveUpdates": {
          ".write": "auth != null && (root.child('events/' + $eventId + '/organizer/userId').val() === auth.uid || auth.token.role === 'admin')"
        }
      }
    },
    "users": {
      "$userId": {
        ".read": "auth.uid === $userId",
        ".write": "auth.uid === $userId"
      }
    }
  }
}
```

## Troubleshooting

### Backend won't start

**Error: MongoDB connection failed**
```powershell
# Check if MongoDB is running
Get-Service -Name MongoDB

# Start MongoDB service
Start-Service -Name MongoDB
```

**Error: Port 5000 already in use**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
Stop-Process -Id PID -Force

# Or change PORT in backend/.env
```

**Error: Firebase initialization failed**
- Double-check all Firebase environment variables
- Ensure `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Verify private key is wrapped in double quotes

### Frontend Issues

**Error: Module not found**
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

**WebSocket connection failed**
- Verify backend is running on port 5000
- Check `REACT_APP_SOCKET_URL` in `.env`
- Look for CORS errors in browser console

**Firebase not working**
- Check browser console for Firebase errors
- Verify all `REACT_APP_FIREBASE_*` variables are set
- Ensure Realtime Database is enabled in Firebase Console

### Push Notifications Not Working

1. Check browser supports notifications (Chrome, Firefox, Edge)
2. Verify notification permission is granted
3. Ensure VAPID key is correct
4. Check Firebase Cloud Messaging is enabled
5. Test with `curl` to FCM API

## Next Steps

Now that everything is set up:

1. **Explore the Application**
   - Create different types of events
   - Test RSVP functionality
   - Try live event tracking
   - Test on multiple devices

2. **Customize**
   - Add your school's branding
   - Modify event categories
   - Customize notification messages
   - Add custom fields to events

3. **Deploy** (See deployment guide)
   - Deploy backend to Heroku/AWS
   - Deploy frontend to Vercel/Netlify
   - Update Firebase security rules
   - Set up production MongoDB

## Useful Commands

### Backend
```powershell
npm start          # Start development server
npm test           # Run tests
npm run dev        # Start with nodemon (auto-restart)
```

### Frontend
```powershell
npm start          # Start development server
npm test           # Run tests
npm run build      # Build for production
```

### MongoDB
```powershell
mongo                              # Connect to MongoDB
mongo --host localhost --port 27017  # Connect with options
mongodump --db event-management    # Backup database
mongorestore --db event-management # Restore database
```

## Support

If you encounter issues:
1. Check the error message carefully
2. Review this guide step-by-step
3. Check browser console for errors
4. Verify all environment variables
5. Ensure all services are running

---

**You're all set! Happy coding! 🎉**
