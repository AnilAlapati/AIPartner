const functions = require("firebase-functions");
const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const localConfig = require("./config");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// --- SECURITY: CORS Whitelist ---
const ALLOWED_ORIGINS = [
  'https://vibeaipartner.web.app',
  'https://vibeaipartner.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

// --- SECURITY: Rate Limiting ---
const rateLimitMap = new Map();
const RATE_LIMIT_REQUESTS = 30; // Max requests per minute per user
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms

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

// --- SECURITY: Restricted CORS ---
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc) in development only
    if (!origin) {
      return callback(null, true);
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' })); // Limit payload size

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// --- SECURITY: Firebase ID Token Verification ---
const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Allow x-user-id fallback for backward compatibility (will be removed in future)
  const legacyUserId = req.headers['x-user-id'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      };
      return next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Fall through to legacy auth
    }
  }
  
  // Legacy fallback - use x-user-id header (for existing sessions)
  // TODO: Remove this fallback after migration period
  if (legacyUserId && legacyUserId !== 'anonymous') {
    req.user = { id: legacyUserId };
    return next();
  }
  
  // Allow anonymous users for now (but track them)
  req.user = { id: 'anonymous_' + Date.now() };
  next();
};

// --- SECURITY: Per-User Rate Limiting ---
const checkRateLimit = (req, res, next) => {
  const userId = req.user?.id || 'anonymous';
  const now = Date.now();
  
  // Get user's request timestamps
  let userRequests = rateLimitMap.get(userId) || [];
  
  // Filter to only recent requests within window
  userRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (userRequests.length >= RATE_LIMIT_REQUESTS) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please slow down.',
      retryAfter: Math.ceil((userRequests[0] + RATE_LIMIT_WINDOW - now) / 1000)
    });
  }
  
  // Add current request
  userRequests.push(now);
  rateLimitMap.set(userId, userRequests);
  
  // Cleanup old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const filtered = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
      if (filtered.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, filtered);
      }
    }
  }
  
  next();
};

// --- SECURITY: Input Validation Helpers ---
const validateChatInput = (req, res, next) => {
  const { message, history } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
  }
  
  if (history && !Array.isArray(history)) {
    return res.status(400).json({ error: 'Invalid history format' });
  }
  
  if (history && history.length > 50) {
    return res.status(400).json({ error: 'History too long (max 50 messages)' });
  }
  
  next();
};

const validatePersonaInput = (req, res, next) => {
  const { history } = req.body;
  
  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: 'History is required and must be an array' });
  }
  
  if (history.length > 100) {
    return res.status(400).json({ error: 'History too long' });
  }
  
  next();
};

const validateMatchInput = (req, res, next) => {
  const { userPersona, candidates } = req.body;
  
  if (!userPersona || typeof userPersona !== 'object') {
    return res.status(400).json({ error: 'Invalid userPersona' });
  }
  
  if (!candidates || !Array.isArray(candidates)) {
    return res.status(400).json({ error: 'Invalid candidates format' });
  }
  
  if (candidates.length > 20) {
    return res.status(400).json({ error: 'Too many candidates (max 20)' });
  }
  
  next();
};

const validateTranscribeInput = (req, res, next) => {
  const { audio, mimeType } = req.body;
  
  if (!audio || typeof audio !== 'string') {
    return res.status(400).json({ error: 'Invalid audio data' });
  }
  
  if (!mimeType || typeof mimeType !== 'string') {
    return res.status(400).json({ error: 'Invalid mimeType' });
  }
  
  // Check audio size (base64 is ~1.33x original, limit to ~5MB audio)
  if (audio.length > 7000000) {
    return res.status(400).json({ error: 'Audio file too large' });
  }
  
  next();
};

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

// Cleanup old sessions
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

// Apply auth and rate limiting to all routes
app.use(verifyAuthToken);
app.use(checkRateLimit);

// Middleware to check user limit before processing requests
app.use(async (req, res, next) => {
  const userId = req.user?.id;
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
  }
  next();
});

// --- SECURITY: Generic Error Handler ---
const handleError = (res, error, context) => {
  console.error(`${context} Error:`, error.message, { stack: error.stack });
  // Don't expose internal error details to client
  res.status(500).json({ error: 'An error occurred. Please try again.' });
};

// 1. CHAT ENDPOINT
app.post(["/chat", "/api/chat"], validateChatInput, async (req, res) => {
  const startTime = Date.now();
  try {
    const { history, message } = req.body;
    const settings = await getSettings();
    const maxWords = settings.MAX_CHAT_RESPONSE_WORDS || 20;

    // Limit history to last 20 messages for performance
    const limitedHistory = (history || []).slice(-20);

    console.log(`Chat request - History length: ${limitedHistory.length}, Message length: ${message.length}`);
    
    // Construct the chat session statefully on the backend
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      history: limitedHistory,
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
    handleError(res, error, 'Chat');
  }
});

// 2. PERSONA ANALYSIS ENDPOINT
app.post(["/persona", "/api/persona"], validatePersonaInput, async (req, res) => {
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
    handleError(res, error, 'Persona');
  }
});

// 3. MATCHING ENDPOINT
app.post(["/match", "/api/match"], validateMatchInput, async (req, res) => {
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
    handleError(res, error, 'Match');
  }
});

// 4. TRANSCRIPTION ENDPOINT
app.post(["/transcribe", "/api/transcribe"], validateTranscribeInput, async (req, res) => {
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
    handleError(res, error, 'Transcription');
  }
});

// Expose the Express API as a single Cloud Function
exports.api = functions.https.onRequest(app);

// --- SCHEDULED CLEANUP: Runs every 15 minutes ---
exports.scheduledCleanup = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
  console.log('Running scheduled session cleanup...');
  await cleanupOldSessions();
  return null;
});
