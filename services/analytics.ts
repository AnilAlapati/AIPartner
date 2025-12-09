import ReactGA from "react-ga4";

// Get GA ID from environment or use placeholder for dev
const GA_MEASUREMENT_ID =
  (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

let isInitialized = false;

/**
 * Initialize Google Analytics
 * Call this once when the app starts
 */
export const initGA = () => {
  if (isInitialized) return;

  // Only initialize in production or if GA ID is set
  if (GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        anonymizeIp: true, // Privacy-friendly
      },
    });
    isInitialized = true;
    console.log("Google Analytics initialized");
  } else {
    console.log("Google Analytics not initialized (no measurement ID)");
  }
};

/**
 * Track page views
 */
export const trackPageView = (path: string, title?: string) => {
  if (!isInitialized) return;
  ReactGA.send({ hitType: "pageview", page: path, title });
};

/**
 * Track custom events
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  if (!isInitialized) return;
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Predefined event trackers for common actions
export const analytics = {
  // Auth events
  userLogin: (method: "google" | "dev") => {
    trackEvent("Auth", "Login", method);
  },

  userLogout: () => {
    trackEvent("Auth", "Logout");
  },

  // Chat events
  chatStarted: () => {
    trackEvent("Chat", "Started");
  },

  chatMessageSent: () => {
    trackEvent("Chat", "Message Sent");
  },

  chatCompleted: () => {
    trackEvent("Chat", "Completed");
  },

  // Persona events
  personaGenerated: () => {
    trackEvent("Persona", "Generated");
  },

  // Matching events
  matchingStarted: () => {
    trackEvent("Matching", "Started");
  },

  matchViewed: (matchScore: number) => {
    trackEvent("Matching", "Match Viewed", undefined, matchScore);
  },

  matchAccepted: (matchScore: number) => {
    trackEvent("Matching", "Match Accepted", undefined, matchScore);
  },

  matchRejected: (matchScore: number) => {
    trackEvent("Matching", "Match Rejected", undefined, matchScore);
  },

  // Profile events
  profileViewed: () => {
    trackEvent("Profile", "Viewed");
  },

  profileEdited: () => {
    trackEvent("Profile", "Edited");
  },

  // Error tracking
  errorOccurred: (errorType: string) => {
    trackEvent("Error", errorType);
  },
};
