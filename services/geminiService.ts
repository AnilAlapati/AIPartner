import { UserPersona, MatchResult, CandidateProfile, Message } from "../types";
import { getCurrentUser } from "./authService";

// Determine API Base URL
// If in development (localhost), we assume the rewrite works locally via `firebase hosting:start`
// or points to the emulator if configured.
// For now, we use a relative path '/api' which works if the app is hosted on Firebase.
const API_BASE = "/api";

/**
 * Mock Session Class to maintain compatibility with App.tsx
 * Instead of SDK's Chat, we manage state and call the backend.
 */
class BackendChatSession {
  private history: { role: "user" | "model"; parts: [{ text: string }] }[] = [];

  constructor() {}

  // Helper to sync history from Message[] format to API format if needed,
  // but for simplicity we keep internal history state here.

  async sendMessage({ message }: { message: string }) {
    // Optimistic update of history
    this.history.push({ role: "user", parts: [{ text: message }] });

    try {
      const user = getCurrentUser();
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "anonymous",
        },
        body: JSON.stringify({
          history: this.history, // Send full history for context
          message: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Backend API Error");
      }

      const data = await response.json();
      const modelText = data.text || "";

      // Update history with response
      this.history.push({ role: "model", parts: [{ text: modelText }] });

      // Return structure compatible with GenerateContentResponse
      return { text: modelText };
    } catch (e) {
      console.error("API Call Failed", e);
      // Remove the user message if failed? Or just error out.
      throw e;
    }
  }
}

// Factory to create the session
export const createChatSession = (): any => {
  return new BackendChatSession();
};

export const transcribeAudio = async (
  audioBase64: string,
  mimeType: string
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: audioBase64, mimeType }),
    });

    if (!response.ok) throw new Error("Transcription failed");
    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const generateUserPersona = async (
  chatHistory: string[]
): Promise<UserPersona> => {
  try {
    const response = await fetch(`${API_BASE}/persona`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: chatHistory }),
    });

    if (!response.ok) throw new Error("Persona generation failed");
    return await response.json();
  } catch (error) {
    console.error("Persona Generation Error", error);
    throw error;
  }
};

/**
 * Pre-filters a large list of candidates to finding a subset likely to match.
 * Done Client-Side to save bandwidth before sending to Backend.
 */
const preFilterCandidates = (
  userPersona: UserPersona,
  allCandidates: CandidateProfile[],
  limit: number = 20
): CandidateProfile[] => {
  const scored = allCandidates.map((candidate) => {
    let score = 0;
    const combinedCandidateText = [...candidate.interests, ...candidate.values]
      .join(" ")
      .toLowerCase();
    userPersona.hobbies.forEach((hobby) => {
      if (combinedCandidateText.includes(hobby.toLowerCase())) score += 2;
    });
    userPersona.coreValues.forEach((val) => {
      if (combinedCandidateText.includes(val.toLowerCase())) score += 3;
    });
    score += Math.random() * 2;
    return { candidate, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.candidate);
};

export const findMatches = async (
  userPersona: UserPersona,
  allCandidates: CandidateProfile[]
): Promise<MatchResult[]> => {
  // 1. Client-Side Pre-filter (Save Backend Costs & Time)
  // Reduced to 8 candidates to speed up Gemini 3 reasoning (User Request #3)
  const shortlistedCandidates = preFilterCandidates(
    userPersona,
    allCandidates,
    8
  );

  try {
    const response = await fetch(`${API_BASE}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPersona,
        candidates: shortlistedCandidates,
      }),
    });

    if (!response.ok) throw new Error("Matching failed");
    return await response.json();
  } catch (error) {
    console.error("Matching Error", error);
    throw error;
  }
};
