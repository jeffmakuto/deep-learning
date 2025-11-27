import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getDatabase, ref, onValue, set, push, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
};

let app, messaging, database;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Cloud Messaging
  if ('Notification' in window && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
  
  // Initialize Realtime Database
  database = getDatabase(app);
  
  console.log('✓ Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.log('Firebase Messaging not available');
      return null;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = (callback) => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    callback(payload);
  });
};

// Realtime Database functions
export const dbRef = (path) => {
  if (!database) return null;
  return ref(database, path);
};

export const dbSet = async (path, data) => {
  if (!database) return;
  const reference = ref(database, path);
  await set(reference, data);
};

export const dbUpdate = async (path, data) => {
  if (!database) return;
  const reference = ref(database, path);
  await update(reference, data);
};

export const dbPush = async (path, data) => {
  if (!database) return;
  const reference = ref(database, path);
  return await push(reference, data);
};

export const dbListen = (path, callback) => {
  if (!database) return () => {};
  const reference = ref(database, path);
  return onValue(reference, (snapshot) => {
    callback(snapshot.val());
  });
};

export { app, messaging, database };
