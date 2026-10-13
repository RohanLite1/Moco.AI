import dotenv from 'dotenv';
dotenv.config();

import { evaluateExpression } from './mathService.js';
import { analyzeScreen } from './screenService.js';
import { translateText } from './translatorService.js';
import { generateStreamingResponse } from './ollamaService.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

/**
 * Autonomous Voice Action Agent
 * Parses natural language voice commands, routes to backend tools, and returns actionable responses.
 */
export async function processVoiceCommand(command, onStatus = null) {
  if (!command || typeof command !== 'string' || !command.trim()) {
    return { success: false, error: 'Empty voice command received' };
  }

  const cleanCmd = command.trim();
  const lower = cleanCmd.toLowerCase();

  onStatus?.('thinking');

  // --- 1. INSTANT REGEX / KEYWORD ROUTING (Ultra fast < 5ms) ---

  // A. Navigation Commands
  if (/\b(open|switch to|go to|show|view)\s+(pomodoro|timer|focus)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'pomodoro',
      reply: 'Switching to Pomodoro Focus timer.'
    };
  }

  if (/\b(open|switch to|go to|show|view)\s+(todo|tasks|task list|checklist)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'todo',
      reply: 'Opening your task queue.'
    };
  }

  if (/\b(open|switch to|go to|show|view|play)\s+(music|waves|lofi|ambient)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'music',
      reply: 'Switching to Ambient Waves player.'
    };
  }

  if (/\b(open|switch to|go to|show|view|play)\s+(games|game|chess|tetris|snake)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'games',
      reply: 'Opening Games arcade.'
    };
  }

  if (/\b(open|switch to|go to|show|view)\s+(chat|assistant|moco)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'chat',
      reply: 'Returning to AI Assistant chat.'
    };
  }

  // B. Math & Calculator Commands
  const mathMatch = lower.match(/(?:calculate|what is|solve|evaluate)\s+(.+)/i);
  if (mathMatch && /[\d+\-*/^().]/.test(mathMatch[1])) {
    try {
      const expr = mathMatch[1].replace(/what is|calculate|solve|\?/gi, '').trim();
      const mathRes = evaluateExpression(expr);
      onStatus?.('idle');
      if (mathRes.result !== null) {
        return {
          success: true,
          action: 'CALCULATE',
          expression: expr,
          result: mathRes.result,
          reply: `The calculated result is ${mathRes.formatted}.`
        };
      }
    } catch (e) {
      // Fall through to LLM
    }
  }

  // C. Screen Capture & Analysis Commands
  if (/\b(what('?s| is) on my (screen|display)|analyze (my )?(screen|display)|look at my screen)\b/i.test(lower)) {
    onStatus?.('speaking');
    try {
      const screenRes = await analyzeScreen(cleanCmd);
      onStatus?.('idle');
      return {
        success: true,
        action: 'ANALYZE_SCREEN',
        reply: screenRes.analysis,
        data: screenRes
      };
    } catch (err) {
      onStatus?.('idle');
      return {
        success: false,
        action: 'ANALYZE_SCREEN',
        reply: `Screen analysis encountered an error: ${err.message}`
      };
    }
  }

  // D. Translation Commands
  const transMatch = cleanCmd.match(/translate\s+["']?(.+?)["']?\s+(?:in|into|to)\s+([a-zA-Z]+)/i);
  if (transMatch) {
    try {
      const textToTrans = transMatch[1].trim();
      const targetLang = transMatch[2].trim();
      const transRes = await translateText(textToTrans, targetLang);
      onStatus?.('idle');
      return {
        success: true,
        action: 'TRANSLATE',
        targetLanguage: targetLang,
        reply: `[${targetLang}]: ${transRes.translation}`,
        data: transRes
      };
    } catch (e) {
      // Fall through to LLM
    }
  }

  // --- 2. LOCAL OLLAMA AGENT FALLBACK (Autonomous Intent Classification) ---
  const agentPrompt = `You are Moco AI's Voice Action Agent.
Analyze the user's spoken command and determine the best action.
Respond ONLY with a JSON object in this exact format (no markdown backticks, no extra text):
{
  "action": "NAVIGATE" | "ANALYZE_SCREEN" | "CHAT",
  "target": "chat" | "pomodoro" | "todo" | "music" | "games" | null,
  "reply": "Short direct response to the user"
}

Spoken Command: "${cleanCmd}"`;

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: agentPrompt,
        stream: false
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data = await res.json();
    const raw = (data.response || '').trim();
    
    // Clean potential markdown blocks
    const jsonStr = raw.replace(/^```json|^```|```$/gm, '').trim();
    const parsed = JSON.parse(jsonStr);

    onStatus?.('idle');
    return {
      success: true,
      action: parsed.action || 'CHAT',
      target: parsed.target || null,
      reply: parsed.reply || cleanCmd
    };
  } catch (err) {
    // If Ollama is offline or JSON parsing fails, fall back to standard chat
    onStatus?.('idle');
    return {
      success: true,
      action: 'CHAT',
      target: null,
      reply: `Heard: "${cleanCmd}". (Ollama agent processed offline)`
    };
  }
}
