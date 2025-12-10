/**
 * Application Configuration
 * Easy to modify settings for production deployment
 */

module.exports = {
  // Application Metadata
  APP_NAME: 'VibeAI',
  APP_TAGLINE: 'Dating Reimagined with Gemini 3 Pro',
  HACKATHON_TRACK: 'Technology / Social Impact',
  GEMINI_MODEL: 'gemini-3-pro-preview',
  
  // User Management
  MAX_ACTIVE_USERS: 50,  // Maximum concurrent active users
  SESSION_TIMEOUT_MINUTES: 60,  // Session expires after 60 minutes of inactivity
  
  // Chat Settings
  MAX_CHAT_MESSAGES: 5,  // Maximum messages per user session
  MAX_CHAT_RESPONSE_WORDS: 100, // Max words per AI response
  
  // Matching
  CANDIDATE_POOL_SIZE: 500,  // Total candidates to generate
  MATCHES_TO_RETURN: 20,  // Top N matches to return
  
  // Profile Source Switch
  USE_GENERATED_PROFILES: true,  // Set to false to use original hardcoded profiles (mockProfiles.ts)
  
  // Hackathon Metadata
  HACKATHON: {
    name: 'Google DeepMind Vibe Coding with Gemini 3 Pro',
    tagline: 'Advanced Reasoning + Native Multimodality',
    features: ['Advanced Reasoning', 'Multimodal Understanding', 'Context Window', 'Real-time Processing'],
  }
};
