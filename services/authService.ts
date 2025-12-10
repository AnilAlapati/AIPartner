import { UserProfile } from "../types";

// Store the raw credential token for API calls
let authToken: string | null = null;

// Helper to decode JWT without external libraries (for display purposes only)
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return null;
  }
};

export const processGoogleCredential = (
  credential: string
): UserProfile | null => {
  const payload = parseJwt(credential);
  if (!payload) return null;

  // Store the token for API authentication
  authToken = credential;
  localStorage.setItem("mypartner_auth_token", credential);

  const user: UserProfile = {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    avatar: payload.picture,
  };

  localStorage.setItem("mypartner_user", JSON.stringify(user));
  return user;
};

// Get the auth token for API calls
export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  // Try to restore from localStorage
  const stored = localStorage.getItem("mypartner_auth_token");
  if (stored) {
    authToken = stored;
    return stored;
  }
  return null;
};

// Fallback for Dev Mode - DISABLED IN PRODUCTION
export const loginAsDev = (): Promise<UserProfile> => {
  return new Promise((resolve, reject) => {
    // Disable dev login in production
    if (import.meta.env.PROD) {
      reject(new Error("Dev mode is disabled in production"));
      return;
    }

    const mockUser: UserProfile = {
      id: "dev_" + Math.random().toString(36).substr(2, 9),
      name: "Developer Mode",
      email: "dev@mypartner.ai",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dev",
    };
    localStorage.setItem("mypartner_user", JSON.stringify(mockUser));
    resolve(mockUser);
  });
};

export const logout = () => {
  // Clear user auth
  authToken = null;
  localStorage.removeItem("mypartner_user");
  localStorage.removeItem("mypartner_auth_token");
  // Clear app state to prevent stale data on re-login
  localStorage.removeItem("vibeai_step");
  localStorage.removeItem("vibeai_chat");
  localStorage.removeItem("vibeai_persona");
  localStorage.removeItem("vibeai_matches");
};

export const getCurrentUser = (): UserProfile | null => {
  const stored = localStorage.getItem("mypartner_user");
  return stored ? JSON.parse(stored) : null;
};
