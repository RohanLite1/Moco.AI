import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

/**
 * Streams response from local Ollama instance (3B/4B model)
 */
export async function generateStreamingResponse(prompt, onChunk, onStatus) {
  const model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;

  try {
    onStatus?.('thinking');

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        system: "You are Moco, a fast, futuristic, and helpful desktop AI companion with a sleek cyber-aesthetic. Keep answers concise, direct, and actionable.",
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status: ${response.status} (${response.statusText})`);
    }

    onStatus?.('speaking');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            fullText += parsed.response;
            onChunk?.(parsed.response);
          }
        } catch (jsonErr) {
          // ignore partial JSON chunk
        }
      }
    }

    onStatus?.('idle');
    return fullText;
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
