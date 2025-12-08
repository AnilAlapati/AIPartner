import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { UserPersona, MatchResult, CandidateProfile } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * MULTI-MODEL STRATEGY (Cost Optimization)
 * ----------------------------------------
 * 1. Chatting: 'gemini-2.5-flash-lite' 
 *    - Lowest latency, extremely cheap. Perfect for casual convo.
 * 
 * 2. Summarization: 'gemini-2.5-flash'
 *    - Best value. Great at extracting data (JSON) and summarizing. 
 *    - Does not need "thinking" time, saving $$$.
 * 
 * 3. Matching: 'gemini-3-pro-preview'
 *    - The "Brain". Uses deep reasoning to find psychological matches.
 *    - We spend the budget here where it counts.
 */
const CHAT_MODEL = 'gemini-2.5-flash-lite'; 
const SUMMARIZATION_MODEL = 'gemini-2.5-flash'; 
const MATCHING_MODEL = 'gemini-3-pro-preview'; 
const AUDIO_MODEL = 'gemini-2.5-flash';

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: `You are 'MyPartner AI', a chill, intuitive, and hype-man wingman for Gen Z users.
      Your goal is to have a casual "vibe check" (conversation) to understand their personality, lore (life history), and what they really want.
      
      Rules:
      1. NEVER use the word "Interview". This is a vibe check.
      2. Be low-key, conversational, and use lower-case often. Use slang appropriately (e.g., "no cap", "bet", "vibes", "aesthetic").
      3. Ask ONE question at a time.
      4. Start by asking for their name and a quick "lore drop" (a defining life moment).
      5. Dig deeper into their answers naturally. If they mention something cool, hype them up.
      6. Keep it short. 
      `,
    },
  });
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: AUDIO_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: audioBase64 } },
          { text: "Transcribe the user's speech in this audio exactly as spoken. Do not add any commentary." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const generateUserPersona = async (chatHistory: string[]): Promise<UserPersona> => {
  const prompt = `Based on the chat history, build a dating profile persona for this user.
  
  Chat History:
  ${chatHistory.join('\n')}
  
  Extract their core values, specific hobbies, communication style (e.g., "text heavy", "facetimer", "meme lord"), and traits they need in a partner.
  Write a witty, 2-sentence summary that captures their essence.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      coreValues: { type: Type.ARRAY, items: { type: Type.STRING } },
      hobbies: { type: Type.ARRAY, items: { type: Type.STRING } },
      communicationStyle: { type: Type.STRING },
      idealPartnerTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
      summary: { type: Type.STRING },
    },
    required: ['coreValues', 'hobbies', 'communicationStyle', 'idealPartnerTraits', 'summary'],
  };

  // SWITCHED TO FLASH: Efficient for summarization, no thinking budget needed.
  const response = await ai.models.generateContent({
    model: SUMMARIZATION_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text) as UserPersona;
};

/**
 * Pre-filters a large list of candidates to finding a subset likely to match.
 * Simulates a Vector Database search using JavaScript keyword overlapping.
 */
const preFilterCandidates = (userPersona: UserPersona, allCandidates: CandidateProfile[], limit: number = 20): CandidateProfile[] => {
  const scored = allCandidates.map(candidate => {
    let score = 0;
    
    // Simple Keyword Matching (Heuristic)
    const combinedCandidateText = [...candidate.interests, ...candidate.values].join(' ').toLowerCase();
    
    // Check overlapping interests
    userPersona.hobbies.forEach(hobby => {
      if (combinedCandidateText.includes(hobby.toLowerCase())) score += 2;
    });

    userPersona.coreValues.forEach(val => {
      if (combinedCandidateText.includes(val.toLowerCase())) score += 3;
    });
    
    // Random factor to ensure variety in the demo
    score += Math.random() * 2; 

    return { candidate, score };
  });

  // Sort by score desc and take top N
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(s => s.candidate);
};

export const findMatches = async (userPersona: UserPersona, allCandidates: CandidateProfile[]): Promise<MatchResult[]> => {
  
  // 1. FILTERING STEP (Simulate Vector DB)
  // We can't send 1000 candidates to Gemini. It's too expensive and hits token limits.
  // We pick the top 15 candidates based on a quick heuristic first.
  const shortlistedCandidates = preFilterCandidates(userPersona, allCandidates, 15);

  const prompt = `I have a user with this persona:
  ${JSON.stringify(userPersona, null, 2)}
  
  And these candidates (Shortlist):
  ${JSON.stringify(shortlistedCandidates, null, 2)}
  
  Task:
  1. Rate the "Ship" potential (compatibility) from 0 to 100.
  2. Give a reasoning that sounds like a friend recommending a date (casual tone).
  3. List 3 key "Green Flags" (compatibility highlights).
  
  Return JSON for ALL candidates provided.`;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        candidateId: { type: Type.STRING },
        matchScore: { type: Type.NUMBER },
        reasoning: { type: Type.STRING },
        compatibilityHighlights: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['candidateId', 'matchScore', 'reasoning', 'compatibilityHighlights'],
    }
  };

  // KEEPING 3 PRO: Complex reasoning is required for good matches.
  // Thinking Budget: 2048 (Optimized for balance between IQ and Cost)
  const response = await ai.models.generateContent({
    model: MATCHING_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      thinkingConfig: { thinkingBudget: 2048 } 
    }
  });

  const text = response.text;
  if (!text) throw new Error("No match analysis from Gemini");
  return JSON.parse(text) as MatchResult[];
};
