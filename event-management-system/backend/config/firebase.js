const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

let firebaseApp;

try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('✓ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  // Continue without Firebase if not configured
  console.log('⚠ Running without Firebase (using local storage only)');
}

// Get Realtime Database reference
const getDatabase = () => {
  if (firebaseApp) {
    return admin.database();
  }
  return null;
};

// Get Firestore reference
const getFirestore = () => {
  if (firebaseApp) {
    return admin.firestore();
  }
  return null;
};

// Send push notification via FCM
const sendPushNotification = async (tokens, notification, data = {}) => {
  if (!firebaseApp) {
    console.log('Firebase not configured, skipping push notification');
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl || null
      },
      data: data,
      tokens: Array.isArray(tokens) ? tokens : [tokens]
    };

    const response = await admin.messaging().sendMulticast(message);
    
    console.log(`✓ Push notifications sent: ${response.successCount}/${tokens.length}`);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  admin,
  getDatabase,
  getFirestore,
  sendPushNotification
};
