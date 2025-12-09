/**
 * Application Configuration
 * Easy to modify settings for production deployment
 */

module.exports = {
  // User Management
  MAX_ACTIVE_USERS: 100,  // Maximum concurrent active users
  SESSION_TIMEOUT_MINUTES: 60,  // Session expires after 60 minutes of inactivity
  
  // Chat Settings
  MAX_CHAT_MESSAGES: 5,  // Maximum messages per user session
  
  // Matching
  CANDIDATE_POOL_SIZE: 500,  // Total candidates to generate
  MATCHES_TO_RETURN: 20,  // Top N matches to return
};
