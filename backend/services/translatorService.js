import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

/**
 * Translates text into target language using local Ollama model
 * @param {string} text - The input text
 * @param {string} targetLanguage - e.g. "Spanish", "French", "German", "Japanese", "Hindi"
 */
export async function translateText(text, targetLanguage = 'Spanish') {
  if (!text || !text.trim()) {
    throw new Error('Text to translate is required');
  }

  const prompt = `You are a professional translator. Translate the text below accurately into ${targetLanguage}.\nOutput ONLY the translated text without conversational filler, notes, or explanations.\n\nText:\n"${text}"`;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data = await response.json();
    return {
      original: text,
      targetLanguage,
      translation: data.response ? data.response.trim().replace(/^"|"$/g, '') : '',
      model: DEFAULT_MODEL
    };
  } catch (err) {
    throw new Error(`Translation failed: ${err.message}`);
  }
}
