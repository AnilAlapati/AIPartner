"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeAudio = exports.findMatches = exports.generatePersona = exports.chat = void 0;
const functions = __importStar(require("firebase-functions"));
const genai_1 = require("@google/genai");
// Initialize Gemini with API key from Firebase config
const getGeminiClient = () => {
    var _a;
    const apiKey = (_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key;
    if (!apiKey) {
        throw new Error("Gemini API key not configured. Run: firebase functions:config:set gemini.key=\"YOUR_KEY\"");
    }
    return new genai_1.GoogleGenAI({ apiKey });
};
// Model configuration
const CHAT_MODEL = "gemini-2.5-flash-lite";
const SUMMARIZATION_MODEL = "gemini-2.5-flash";
const MATCHING_MODEL = "gemini-3-pro-preview";
// Chat endpoint
exports.chat = functions.https.onCall(async (data) => {
    const ai = getGeminiClient();
    const { message } = data;
    try {
        const chat = ai.chats.create({
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
        const response = await chat.sendMessage({ message });
        return { text: response.text };
    }
    catch (error) {
        console.error("Chat error:", error);
        throw new functions.https.HttpsError("internal", "Failed to process chat message");
    }
});
// Generate user persona from chat history
exports.generatePersona = functions.https.onCall(async (data) => {
    const ai = getGeminiClient();
    const { chatHistory } = data;
    const prompt = `Based on the chat history, build a dating profile persona for this user.
  
  Chat History:
  ${chatHistory.join("\n")}
  
  Extract their core values, specific hobbies, communication style (e.g., "text heavy", "facetimer", "meme lord"), and traits they need in a partner.
  Write a witty, 2-sentence summary that captures their essence.`;
    try {
        const response = await ai.models.generateContent({
            model: SUMMARIZATION_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        coreValues: { type: "array", items: { type: "string" } },
                        hobbies: { type: "array", items: { type: "string" } },
                        communicationStyle: { type: "string" },
                        idealPartnerTraits: { type: "array", items: { type: "string" } },
                        summary: { type: "string" },
                    },
                    required: ["coreValues", "hobbies", "communicationStyle", "idealPartnerTraits", "summary"],
                },
            },
        });
        const text = response.text;
        if (!text)
            throw new Error("No response from Gemini");
        return JSON.parse(text);
    }
    catch (error) {
        console.error("Persona generation error:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate persona");
    }
});
// Pre-filter candidates (helper function)
const preFilterCandidates = (userPersona, allCandidates, limit = 20) => {
    const scored = allCandidates.map((candidate) => {
        let score = 0;
        const combinedCandidateText = [...candidate.interests, ...candidate.values].join(" ").toLowerCase();
        userPersona.hobbies.forEach((hobby) => {
            if (combinedCandidateText.includes(hobby.toLowerCase()))
                score += 2;
        });
        userPersona.coreValues.forEach((val) => {
            if (combinedCandidateText.includes(val.toLowerCase()))
                score += 3;
        });
        score += Math.random() * 2;
        return { candidate, score };
    });
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.candidate);
};
// Find matches endpoint
exports.findMatches = functions.https.onCall(async (data) => {
    const ai = getGeminiClient();
    const { userPersona, candidates } = data;
    const shortlistedCandidates = preFilterCandidates(userPersona, candidates, 15);
    const prompt = `I have a user with this persona:
  ${JSON.stringify(userPersona, null, 2)}
  
  And these candidates (Shortlist):
  ${JSON.stringify(shortlistedCandidates, null, 2)}
  
  Task:
  1. Rate the "Ship" potential (compatibility) from 0 to 100.
  2. Give a reasoning that sounds like a friend recommending a date (casual tone).
  3. List 3 key "Green Flags" (compatibility highlights).
  
  Return JSON for ALL candidates provided.`;
    try {
        const response = await ai.models.generateContent({
            model: MATCHING_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            candidateId: { type: "string" },
                            matchScore: { type: "number" },
                            reasoning: { type: "string" },
                            compatibilityHighlights: { type: "array", items: { type: "string" } },
                        },
                        required: ["candidateId", "matchScore", "reasoning", "compatibilityHighlights"],
                    },
                },
                thinkingConfig: { thinkingBudget: 2048 },
            },
        });
        const text = response.text;
        if (!text)
            throw new Error("No match analysis from Gemini");
        return JSON.parse(text);
    }
    catch (error) {
        console.error("Matching error:", error);
        throw new functions.https.HttpsError("internal", "Failed to find matches");
    }
});
// Transcribe audio endpoint
exports.transcribeAudio = functions.https.onCall(async (data) => {
    const ai = getGeminiClient();
    const { audioBase64, mimeType } = data;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType, data: audioBase64 } },
                    { text: "Transcribe the user's speech in this audio exactly as spoken. Do not add any commentary." },
                ],
            },
        });
        return { text: response.text || "" };
    }
    catch (error) {
        console.error("Transcription error:", error);
        throw new functions.https.HttpsError("internal", "Failed to transcribe audio");
    }
});
//# sourceMappingURL=index.js.map