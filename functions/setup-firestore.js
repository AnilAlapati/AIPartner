/**
 * Setup script to initialize Firestore settings collection
 * Run this once to create the initial config document
 * 
 * Usage: node setup-firestore.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const initializeSettings = async () => {
  try {
    console.log('Initializing Firestore settings...');
    
    const settingsData = {
      MAX_ACTIVE_USERS: 100,
      SESSION_TIMEOUT_MINUTES: 60,
      MAX_CHAT_MESSAGES: 5,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'admin-setup'
    };

    await db.collection('config').doc('limits').set(settingsData);
    
    console.log('✓ Settings initialized successfully!');
    console.log('Current settings:');
    console.log(JSON.stringify(settingsData, null, 2));
    console.log('\nYou can now edit these values in Firebase Console:');
    console.log('1. Go to: https://console.firebase.google.com/');
    console.log('2. Select "vibeaipartner" project');
    console.log('3. Go to Firestore Database');
    console.log('4. Find "config" collection > "limits" document');
    console.log('5. Edit the values directly in the console');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing settings:', error);
    process.exit(1);
  }
};

initializeSettings();
