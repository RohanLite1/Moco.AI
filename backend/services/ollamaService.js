import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

// In-memory conversation history for multi-turn chat
let conversationHistory = [];

const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are Moco, a friendly, sharp, and helpful desktop AI companion.
Guidelines:
- Speak naturally, warmly, and concisely like a smart friend.
- Never use cold, robotic phrases like "Query received", "Processing request", or "Awaiting command".
- When greeted with "hey", "hi", "hello", or similar greetings, respond warmly and ask how you can help.
- Give accurate, clear, and direct answers formatted nicely for a desktop HUD.
- Keep responses concise unless the user explicitly asks for detailed explanations.`
};

export function clearConversationHistory() {
  conversationHistory = [];
  return true;
}

export function getConversationHistory() {
  return [...conversationHistory];
}

/**
 * Streams response from local Ollama instance with multi-turn memory
 */
export async function generateStreamingResponse(prompt, onChunk, onStatus) {
  const model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;

  try {
    onStatus?.('thinking');

    // Add user message to history
    conversationHistory.push({ role: 'user', content: prompt });

    // Keep history manageable (last 16 messages)
    if (conversationHistory.length > 16) {
      conversationHistory = conversationHistory.slice(-16);
    }

    const messages = [SYSTEM_PROMPT, ...conversationHistory];

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
        options: {
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status: ${response.status} (${response.statusText})`);
    }

    onStatus?.('speaking');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullAssistantResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const chunk = parsed.message?.content || parsed.response;
          if (chunk) {
            fullAssistantResponse += chunk;
            onChunk?.(chunk);
          }
        } catch (jsonErr) {
          // ignore partial JSON chunk
        }
      }
    }

    // Save assistant reply to memory
    if (fullAssistantResponse) {
      conversationHistory.push({ role: 'assistant', content: fullAssistantResponse });
    }

    onStatus?.('idle');
    return fullAssistantResponse;
  } catch (err) {
    onStatus?.('idle');
    if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      const offlineMsg = `[Moco AI]: Cannot connect to local Ollama at ${OLLAMA_HOST}.\n\nPlease ensure Ollama is running by opening PowerShell and running:\nollama run ${model}`;
      onChunk?.(offlineMsg);
      return offlineMsg;
    }
    throw err;
  }
}

/**
 * Checks if Ollama is running and which models are available locally
 */
export async function checkOllamaHealth() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (!res.ok) return { online: false, models: [] };
    const data = await res.json();
    return {
      online: true,
      models: data.models?.map(m => m.name) || []
    };
  } catch (e) {
    return { online: false, models: [] };
  }
}
