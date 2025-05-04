export async function getDialogueWithGemini(inputText) {

  const API_KEY = "AIzaSyCVInLlj_-yiQRPdfhJuJyD1JDhqqmKqCo";
  const flashUrl= `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  const flashLiteUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: inputText }],
      },
    ],
  };

  try {
    const response = await fetch(flashUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.candidates && data.candidates[0]) {
      return data.candidates[0].content.parts[0].text;
    }
  } catch (error) {
    console.error("Error fetching dialogue from API:", error);
  }

  return "{}";
}