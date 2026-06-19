// CampusPulse Gemini AI Service Layer

/**
 * Helper to query Gemini API using direct REST call to handle AQ. API keys natively.
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

  console.log('[CALLING GEMINI] Sending prompt to Gemini 2.5 Flash via REST...');
  
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      throw new Error('Invalid or empty response from Gemini API');
    }

    console.log(`[GEMINI RESPONSE RECEIVED] Generation successful. Reply size: ${resultText.length} chars`);
    return resultText;
  } catch (err) {
    console.error('[GEMINI ERROR] Exception during REST call:', err);
    throw err;
  }
}
