const functions = require("firebase-functions");
const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const localConfig = require("./config");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Cache for settings to avoid reading Firestore on every request
let cachedSettings = null;
let settingsCacheTime = 0;
const CACHE_DURATION = 60000; // Cache for 60 seconds

// Get settings from Firestore or cache
const getSettings = async () => {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - settingsCacheTime) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const settingsDoc = await db.collection('config').doc('limits').get();
    if (settingsDoc.exists) {
      cachedSettings = settingsDoc.data();
      settingsCacheTime = now;
      return cachedSettings;
    } else {
      // Initialize if not exists
      console.log('Initializing default settings in Firestore...');
      await db.collection('config').doc('limits').set(localConfig);
      cachedSettings = localConfig;
      settingsCacheTime = now;
      return cachedSettings;
    }
  } catch (error) {
    console.error('Error fetching settings from Firestore:', error);
  }

  // Fall back to local config if Firestore read fails
  console.log('Using fallback config');
  return localConfig;
};

// Initialize Express App for API routing
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Initialize Gemini
// CRITICAL: Ensure you set this via: firebase functions:config:set gemini.key="YOUR_KEY"
const apiKey = functions.config().gemini?.key || process.env.API_KEY;
console.log("Gemini API Key configured:", !!apiKey);
const ai = new GoogleGenAI({ apiKey: apiKey });

// --- MODELS STRATEGY ---
// Reverted to Gemini 3 for maximum reasoning capability & branding
const CHAT_MODEL = 'gemini-3-pro-preview'; 
const SUMMARIZATION_MODEL = 'gemini-2.5-flash';
const MATCHING_MODEL = 'gemini-3-pro-preview';
const AUDIO_MODEL = 'gemini-2.5-flash';

// --- USER SESSION MANAGEMENT ---
const checkAndRegisterUser = async (userId) => {
  try {
    const settings = await getSettings();
    const usersRef = db.collection('activeUsers');
    const snapshot = await usersRef.get();
    const activeUserCount = snapshot.size;

    // Check if user already has an active session
    const userDoc = await usersRef.doc(userId).get();
    if (userDoc.exists) {
      // User already registered, just update last active time
      await usersRef.doc(userId).update({
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      });
      return { allowed: true, message: 'User already in session' };
    }

    // Check if we're at capacity
    if (activeUserCount >= settings.MAX_ACTIVE_USERS) {
      return { 
        allowed: false, 
        message: `At maximum capacity (${settings.MAX_ACTIVE_USERS} users). Please try again later.`,
        activeUsers: activeUserCount
      };
    }

    // Register new user
    await usersRef.doc(userId).set({
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      allowed: true, 
      message: 'User registered', 
      activeUsers: activeUserCount + 1 
    };
  } catch (error) {
    console.error('User registration error:', error);
    // Allow on error to not block users due to DB issues
    return { allowed: true, message: 'Registration check skipped due to error' };
  }
};

// Cleanup old sessions (runs on each request)
const cleanupOldSessions = async () => {
  try {
    const settings = await getSettings();
    const timeoutMinutes = settings.SESSION_TIMEOUT_MINUTES;
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    const usersRef = db.collection('activeUsers');
    const oldSessions = await usersRef.where('lastActive', '<', cutoffTime).get();
    
    const batch = db.batch();
    oldSessions.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (oldSessions.size > 0) {
      await batch.commit();
      console.log(`Cleaned up ${oldSessions.size} expired sessions`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Middleware to check user limit before processing requests
app.use(async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const path = req.path;
  // Check for paths with or without /api prefix
  if (userId && (path.endsWith('/chat') || path.endsWith('/persona') || path.endsWith('/match'))) {
    const registration = await checkAndRegisterUser(userId);
    if (!registration.allowed) {
      return res.status(429).json({ 
        error: registration.message,
        retryAfter: 60 
      });
    }
    // Cleanup expired sessions in background
    cleanupOldSessions().catch(err => console.error('Cleanup failed:', err));
  }
  next()
});

// 1. CHAT ENDPOINT
app.post(["/chat", "/api/chat"], async (req, res) => {
  const startTime = Date.now();
  try {
    const { history, message } = req.body;
    const settings = await getSettings();
    const maxWords = settings.MAX_CHAT_RESPONSE_WORDS || 20;

    console.log(`Chat request - History length: ${history?.length || 0}, Message length: ${message?.length || 0}`);
    
    // Construct the chat session statefully on the backend
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      history: history || [], // { role: 'user' | 'model', parts: [{ text: string }] }
      config: {
        systemInstruction: `You are 'MyPartner AI', a chill, intuitive, and hype-man wingman for Gen Z users.
        Your goal is to have a casual "vibe check" (conversation) to understand their personality, lore (life history), and what they really want.
        NEVER use the word "Interview". This is a vibe check.
        Be low-key, conversational, and use lower-case often. Use slang appropriately (e.g., "no cap", "bet", "vibes", "aesthetic").
        Ask ONE question at a time.
        Start by asking for their name and a quick "lore drop" (a defining life moment).
        Dig deeper into their answers naturally.
        IMPORTANT: Keep your responses VERY SHORT (max ${maxWords} words). Be punchy.`,
      },
    });

    const result = await chat.sendMessage({ message });
    const duration = Date.now() - startTime;
    console.log(`Chat response generated in ${duration}ms - Response length: ${result.text?.length || 0}`);
    res.json({ text: result.text });

  } catch (error) {
    console.error("Chat Error:", error.message, { stack: error.stack, historyLength: req.body.history?.length });
    res.status(500).json({ error: error.message });
  }
});

// 2. PERSONA ANALYSIS ENDPOINT
app.post(["/persona", "/api/persona"], async (req, res) => {
  try {
    const { history } = req.body; // Array of strings ["USER: hi", "MODEL: hello"]
    
    const prompt = `Based on the chat history, build a dating profile persona for this user.
    
    Chat History:
    ${history.join('\n')}
    
    Extract their core values, specific hobbies, communication style, and traits they need in a partner.
    Write a witty, 2-sentence summary that captures their essence.`;

    // Define Schema manually for JSON response
    const schema = {
      type: 'OBJECT',
      properties: {
        coreValues: { type: 'ARRAY', items: { type: 'STRING' } },
        hobbies: { type: 'ARRAY', items: { type: 'STRING' } },
        communicationStyle: { type: 'STRING' },
        idealPartnerTraits: { type: 'ARRAY', items: { type: 'STRING' } },
        summary: { type: 'STRING' },
      },
      required: ['coreValues', 'hobbies', 'communicationStyle', 'idealPartnerTraits', 'summary'],
    };

    const response = await ai.models.generateContent({
      model: SUMMARIZATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    res.json(JSON.parse(response.text));

  } catch (error) {
    console.error("Persona Error:", error.message, { stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// 3. MATCHING ENDPOINT
app.post(["/match", "/api/match"], async (req, res) => {
  try {
    const { userPersona, candidates } = req.body;

    const prompt = `I have a user with this persona:
    ${JSON.stringify(userPersona)}
    
    And these candidates:
    ${JSON.stringify(candidates)}
    
    Task:
    1. Rate the "Ship" potential (compatibility) from 0 to 100.
    2. Give a reasoning that sounds like a friend recommending a date (casual tone).
    3. List 3 key "Green Flags" (compatibility highlights).
    
    Return JSON for ALL candidates.`;

    const schema = {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          candidateId: { type: 'STRING' },
          matchScore: { type: 'NUMBER' },
          reasoning: { type: 'STRING' },
          compatibilityHighlights: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['candidateId', 'matchScore', 'reasoning', 'compatibilityHighlights'],
      }
    };

    const response = await ai.models.generateContent({
      model: MATCHING_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 2048 } 
      }
    });

    res.json(JSON.parse(response.text));

  } catch (error) {
    console.error("Match Error:", error.message, { stack: error.stack, candidatesCount: req.body.candidates?.length });
    res.status(500).json({ error: error.message });
  }
});

// 4. TRANSCRIPTION ENDPOINT
app.post(["/transcribe", "/api/transcribe"], async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    
    const response = await ai.models.generateContent({
      model: AUDIO_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: audio } },
          { text: "Transcribe the user's speech in this audio exactly as spoken. Do not add any commentary." }
        ]
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Transcription Error:", error.message, { stack: error.stack, mimeType: req.body.mimeType });
    res.status(500).json({ error: error.message });
  }
});

// Expose the Express API as a single Cloud Function
exports.api = functions.https.onRequest(app);
