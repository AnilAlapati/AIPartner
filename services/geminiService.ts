import { GoogleGenAI, Chat, Type, Schema } from "@google/genai";
import { UserPersona, MatchResult, CandidateProfile } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models configuration based on requirements
const CHAT_MODEL = 'gemini-2.5-flash-lite'; // Fast low-latency responses
const COMPLEX_MODEL = 'gemini-3-pro-preview'; // Deep reasoning/thinking
const AUDIO_MODEL = 'gemini-2.5-flash'; // Audio transcription

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

  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      // Using max thinking budget for complex analysis
      thinkingConfig: { thinkingBudget: 32768 } 
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text) as UserPersona;
};

export const findMatches = async (userPersona: UserPersona, candidates: CandidateProfile[]): Promise<MatchResult[]> => {
  const prompt = `I have a user with this persona:
  ${JSON.stringify(userPersona, null, 2)}
  
  And these candidates:
  ${JSON.stringify(candidates, null, 2)}
  
  Task:
  1. Rate the "Ship" potential (compatibility) from 0 to 100.
  2. Give a reasoning that sounds like a friend recommending a date (casual tone).
  3. List 3 key "Green Flags" (compatibility highlights).
  
  Return JSON for ALL candidates.`;

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

  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      // Using max thinking budget for complex matching logic
      thinkingConfig: { thinkingBudget: 32768 } 
    }
  });

  const text = response.text;
  if (!text) throw new Error("No match analysis from Gemini");
  return JSON.parse(text) as MatchResult[];
};