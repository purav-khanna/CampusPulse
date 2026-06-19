// CampusPulse Gemini AI Service Layer
import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

/**
 * Helper to query Gemini API using official SDK
 * @param {string} promptText
 * @returns {Promise<string>}
 */
export async function callGemini(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('Gemini API key is not configured.');
    console.error('[GEMINI ERROR] Configuration Error: GEMINI_API_KEY is missing.');
    throw err;
  }

  // Initialize SDK if not already done
  if (!genAI || !model) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  console.log('[CALLING GEMINI] Sending prompt to Gemini 2.5 Flash...');
  
  try {
    const result = await model.generateContent(promptText);
    const response = await result.response;
    const resultText = response.text();
    console.log(`[GEMINI RESPONSE RECEIVED] Generation successful. Reply size: ${resultText.length} chars`);
    return resultText;
  } catch (err) {
    console.error('[GEMINI ERROR] Exception during SDK call:', err);
    throw err;
  }
}
