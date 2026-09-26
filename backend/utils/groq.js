import Groq from "groq-sdk";

const GROQ_MODEL = "openai/gpt-oss-120b";

/**
 * Calls Groq's chat completion API.
 * Same pattern you already used in FarmVision's chatbot — just moved to Node.
 */
export async function callGroq(systemPrompt, userPrompt, jsonMode = false) {
  if (!process.env.GROQ_API_KEY) {
    return { error: "GROQ_API_KEY not set. Add it to your .env file." };
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const payload = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.4,
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  try {
    const completion = await groq.chat.completions.create(payload);
    return completion.choices[0].message.content;
  } catch (err) {
    return { error: err.message || "Groq API call failed." };
  }
}
