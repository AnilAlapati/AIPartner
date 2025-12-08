const functions = require("firebase-functions");
const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");

// Initialize Express App for API routing
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Gemini
// CRITICAL: Ensure you set this via: firebase functions:config:set gemini.key="YOUR_KEY"
const apiKey = functions.config().gemini?.key || process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// --- MODELS STRATEGY ---
const CHAT_MODEL = 'gemini-2.5-flash-lite';
const SUMMARIZATION_MODEL = 'gemini-2.5-flash';
const MATCHING_MODEL = 'gemini-3-pro-preview';
const AUDIO_MODEL = 'gemini-2.5-flash';

// 1. CHAT ENDPOINT
app.post("/chat", async (req, res) => {
  try {
    const { history, message } = req.body;
    
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
        Dig deeper into their answers naturally.`,
      },
    });

    const result = await chat.sendMessage({ message });
    res.json({ text: result.text });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. PERSONA ANALYSIS ENDPOINT
app.post("/persona", async (req, res) => {
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
    console.error("Persona Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. MATCHING ENDPOINT
app.post("/match", async (req, res) => {
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
    console.error("Match Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. TRANSCRIPTION ENDPOINT
app.post("/transcribe", async (req, res) => {
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
    console.error("Transcription Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Expose the Express API as a single Cloud Function
exports.api = functions.https.onRequest(app);
