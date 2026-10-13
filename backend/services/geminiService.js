import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let aiClient = null;

function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

export async function generateStreamingResponse(prompt, onChunk, onStatus) {
  const client = getAIClient();
  
  if (!client) {
    onStatus?.('thinking');
    await new Promise(r => setTimeout(r, 600));
    onStatus?.('speaking');
    const mockReply = `[Moco AI]: Gemini API key is not configured yet. Add GEMINI_API_KEY to your .env file! Echo: "${prompt}"`;
    for (const char of mockReply.split(' ')) {
      onChunk?.(char + ' ');
      await new Promise(r => setTimeout(r, 40));
    }
    onStatus?.('idle');
    return mockReply;
  }

  try {
    onStatus?.('thinking');
    const responseStream = await client.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are Moco, a futuristic, helpful, and concise desktop AI companion with a sleek cyber-aesthetic. Keep answers punchy and helpful for productivity."
      }
    });

    onStatus?.('speaking');
    let fullText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk?.(text);
      }
    }
    onStatus?.('idle');
    return fullText;
  } catch (err) {
    onStatus?.('idle');
    throw err;
  }
}
