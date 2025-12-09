const { GoogleGenAI } = require("@google/genai");

const apiKey = "***REMOVED***";
const ai = new GoogleGenAI({ apiKey: apiKey });

async function test() {
  try {
    console.log("Testing Gemini API...");
    const model = "gemini-3-pro-preview"; // Testing Gemini 3
    console.log(`Using model: ${model}`);
    
    // Try to use chat
    const chat = ai.chats.create({
      model: model,
      history: [],
      config: {
        systemInstruction: "You are a helpful assistant.",
      },
    });

    const result = await chat.sendMessage({ message: "Hello, are you working?" });
    
    console.log("Chat Result:", JSON.stringify(result, null, 2));
    console.log("Chat Result Text:", result.text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
