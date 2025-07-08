// File: netlify/functions/ask-gemini.js
// --- CORRECTED VERSION ---

exports.handler = async function(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { chatHistory, userQuestion, guidelineTextContent, currentLang } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY; // Securely get the key from Netlify's environment

    if (!apiKey) {
      throw new Error("API key is not set.");
    }

    const prompt = `
    You are a helpful assistant providing general health information related to pregnancy.
    You can also refer to the Ethiopian National Antenatal Care Guideline (February 2022) if relevant.
    Here is the guideline content for reference, but you are not strictly limited to it:
    ---
    ${guidelineTextContent}
    ---
    User's question: "${userQuestion}"
    Please answer the user's question concisely and accurately. If the information is not generally available or if it requires personalized medical advice, state that you cannot answer and advise consulting a healthcare professional. Respond in ${currentLang === 'en' ? 'English' : 'Amharic'}.
    `;
    
    const newChatHistory = [...chatHistory, { role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: newChatHistory };
    
    // THE ONLY CHANGE IS ON THIS LINE: Using the latest stable model
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error in Netlify function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
