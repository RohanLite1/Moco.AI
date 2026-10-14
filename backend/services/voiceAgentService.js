import dotenv from 'dotenv';
dotenv.config();

import { evaluateExpression } from './mathService.js';
import { analyzeScreen } from './screenService.js';
import { translateText } from './translatorService.js';
import { generateStreamingResponse } from './ollamaService.js';
import { askLiveSearchAI } from './searchService.js';

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

  // 0. Instant Greetings & Companion Small Talk (< 2ms)
  if (/^(hey|hi|hello|yo|howdy|good\s+(morning|afternoon|evening)|sup|what's\s+up|hiya)(?:\s+(there|moco|buddy|friend))?[.!?]?$/i.test(lower)) {
    const greetings = [
      "Hey! What are we working on today?",
      "Hi there! How can I help you?",
      "Hey! I'm here, what's on your mind?",
      "Hello! Ready whenever you are."
    ];
    const reply = greetings[Math.floor(Math.random() * greetings.length)];
    onStatus?.('idle');
    return {
      success: true,
      action: 'CHAT',
      target: null,
      reply
    };
  }

  if (/^(who\s+are\s+you|what\s+is\s+your\s+name|what\s+are\s+you)[.!?]?$/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'CHAT',
      target: null,
      reply: "I'm Moco, your desktop companion and productivity AI."
    };
  }

  if (/^(how\s+are\s+you|how's\s+it\s+going|how\s+are\s+things|how\s+do\s+you\s+feel)[.!?]?$/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'CHAT',
      target: null,
      reply: "Feeling great and ready to build! How are you doing today?"
    };
  }

  if (/^(thank\s+you|thanks|thanks\s+moco|thank\s+you\s+so\s+much)[.!?]?$/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'CHAT',
      target: null,
      reply: "You're very welcome! Let me know if you need anything else."
    };
  }

  // Instant Date & Time Commands (< 1ms)
  if (
    (/\b(date|day)\b/i.test(lower) && /\b(what|today|current|tell|which|now)\b/i.test(lower)) ||
    /\b(today'?s date|current date|what day is (it|today))\b/i.test(lower)
  ) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    onStatus?.('idle');
    return {
      success: true,
      action: 'CHAT',
      target: null,
      reply: `Today is ${dateStr}.`
    };
  }

  if (
    (/\b(time)\b/i.test(lower) && /\b(what|current|tell|now)\b/i.test(lower)) ||
    /\b(what('s| is) (the )?time( now)?|current time|what time is it)\b/i.test(lower)
  ) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    onStatus?.('idle');
    return {
      success: true,
      action: 'CHAT',
      target: null,
      reply: `The current time is ${timeStr}.`
    };
  }

  // Robot Physical Actions & Tricks (< 1ms)
  if (/\b(dance|do a dance|groove|start dancing)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'ROBOT_ACTION',
      target: 'dance',
      reply: 'Starting dance mode!'
    };
  }

  if (/\b(spin|spin around|do a 360|do a spin|turn around)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'ROBOT_ACTION',
      target: 'spin',
      reply: '360 gyroscopic spin!'
    };
  }

  if (/\b(wave|wave at me|wave paws|say hi|wave your hand|say hello)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'ROBOT_ACTION',
      target: 'wave',
      reply: 'Hello! Waving at you!'
    };
  }

  if (/\b(cheer|celebrate|hooray|yay|do a cheer|good dog|good boy|good robot)\b/i.test(lower)) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'ROBOT_ACTION',
      target: 'cheer',
      reply: 'Hooray! Celebrating with you!'
    };
  }

  // A. Navigation Commands (handles articles like "the", "my", "a", "some")
  if (
    /\b(open|switch to|go to|show|view|start|launch|set|run)\s+(?:the\s+|a\s+)?(pomodoro|timer|focus|study timer)\b/i.test(lower) ||
    /\b(pomodoro timer|focus mode|focus timer)\b/i.test(lower)
  ) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'pomodoro',
      reply: 'Switching to Pomodoro Focus timer.'
    };
  }

  if (
    /\b(open|switch to|go to|show|view|check|list)\s+(?:the\s+|my\s+|our\s+)?(todo|tasks|task list|checklist|todos|task queue)\b/i.test(lower) ||
    /\b(my tasks|todo list|task queue)\b/i.test(lower)
  ) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'todo',
      reply: 'Opening your task queue.'
    };
  }

  if (
    /\b(open|switch to|go to|show|view|play|listen to|start)\s+(?:the\s+|some\s+)?(music|waves|lofi|ambient|songs|audio|track)\b/i.test(lower) ||
    /\b(lofi music|ambient waves|ambient sound)\b/i.test(lower)
  ) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'music',
      reply: 'Switching to Ambient Waves player.'
    };
  }

  if (
    /\b(open|switch to|go to|show|view|play|launch|start)\s+(?:the\s+|a\s+)?(games|game|arcade|chess|checkers|tetris|snake)\b/i.test(lower) ||
    /\b(play chess|play tetris|play snake|play checkers|play a game)\b/i.test(lower)
  ) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'games',
      reply: 'Opening Games arcade.'
    };
  }

  if (
    /\b(open|switch to|go to|show|view|talk to)\s+(?:the\s+)?(chat|assistant|moco|conversation|dialog)\b/i.test(lower)
  ) {
    onStatus?.('idle');
    return {
      success: true,
      action: 'NAVIGATE',
      target: 'chat',
      reply: 'Returning to AI Assistant chat.'
    };
  }

  // B. Math & Calculator Commands (converts spoken words like 'plus', 'times', 'divided by')
  let spokenMath = lower
    .replace(/\bplus\b/g, '+')
    .replace(/\bminus\b/g, '-')
    .replace(/\b(?:multiplied by|times)\b/g, '*')
    .replace(/\b(?:divided by|over)\b/g, '/')
    .replace(/\b(?:to the power of)\b/g, '^')
    .replace(/\bsquared\b/g, '^2')
    .replace(/\bcubed\b/g, '^3');

  const mathMatch = spokenMath.match(/(?:calculate|what is|solve|evaluate)\s+(.+)/i);
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

  // C. Screen Capture & Analysis Commands (Strict: requires screen/display keywords)
  if (/\b(what('?s| is) on my (screen|display)|analyze (my )?(screen|display)|look at my (screen|display)|read (my )?(screen|display))\b/i.test(lower)) {
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

  // E. Live Weather & Real-Time Web Search Commands
  if (
    /\b(weather|temperature|forecast|is it raining|how cold|how hot|climate)\b/i.test(lower) ||
    /\b(search for|search the web for|look up|google|what is the latest news|who won)\b/i.test(lower)
  ) {
    onStatus?.('speaking');
    try {
      const searchRes = await askLiveSearchAI(cleanCmd);
      onStatus?.('idle');
      return searchRes;
    } catch (e) {
      // Fall through to LLM
    }
  }

  // --- 2. LOCAL OLLAMA AGENT FALLBACK (Autonomous Intent Classification) ---
  const agentPrompt = `You are Moco AI's Voice Action Agent.
Analyze the user's spoken command and determine the best action.
Strict Rules:
- NAVIGATE: if the user wants to switch tabs or open a feature. Targets: "pomodoro", "todo", "music", "games", "chat".
- CALCULATE: for math calculations.
- TRANSLATE: for translation into other languages.
- ANALYZE_SCREEN: ONLY if user explicitly asks to view/inspect their screen or display. NEVER use this for navigation!
- CHAT: for general questions, jokes, ideas, or assistant conversation.

Respond ONLY with a JSON object in this exact format (no markdown backticks, no extra text):
{
  "action": "NAVIGATE" | "CALCULATE" | "TRANSLATE" | "ANALYZE_SCREEN" | "CHAT",
  "target": "chat" | "pomodoro" | "todo" | "music" | "games" | null,
  "reply": "Short natural response to user"
}

Spoken Command: "${cleanCmd}"`;

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: agentPrompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.2
        }
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

    let action = (parsed.action || 'CHAT').toUpperCase();
    let target = parsed.target || null;
    let reply = parsed.reply || cleanCmd;

    // Safety correction: If LLM returned ANALYZE_SCREEN without "screen" in command
    if (action === 'ANALYZE_SCREEN' && !/\b(screen|display)\b/i.test(lower)) {
      if (target && ['pomodoro', 'todo', 'music', 'games', 'chat'].includes(target)) {
        action = 'NAVIGATE';
      } else {
        action = 'CHAT';
      }
    }

    // Safety correction: If action is MUSIC or GAME, map to NAVIGATE
    if (action === 'MUSIC') {
      action = 'NAVIGATE';
      target = 'music';
    } else if (action === 'GAME' || action === 'GAMES') {
      action = 'NAVIGATE';
      target = 'games';
    }

    // Safety correction: If target is a valid section and command implies opening/playing
    if (target && ['pomodoro', 'todo', 'music', 'games', 'chat'].includes(target)) {
      if (/\b(open|switch|go|show|view|play|start|launch|set)\b/i.test(lower)) {
        action = 'NAVIGATE';
      }
    }

    onStatus?.('idle');
    return {
      success: true,
      action,
      target,
      reply
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
