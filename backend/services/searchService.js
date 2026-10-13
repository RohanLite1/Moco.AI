import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';

/**
 * Free, Zero-API-Key Real-time Weather Fetcher
 * Uses wttr.in custom formatted output with DuckDuckGo fallback
 */
export async function getLiveWeather(location = '') {
  const cleanLocation = location ? encodeURIComponent(location.trim()) : '';

  // 1. Try formatted wttr.in query
  try {
    const formatUrl = `https://wttr.in/${cleanLocation}?format=%l:+%C+%t+(feels+like+%f),+humidity+%h,+wind+%w`;
    const res = await fetch(formatUrl, {
      headers: { 'User-Agent': 'curl/7.88.1' }
    });

    if (res.ok) {
      const text = (await res.text()).trim();
      if (text && !text.includes('Unknown location') && !text.includes('500 Internal')) {
        return {
          success: true,
          location: location || 'Current Location',
          summary: text
        };
      }
    }
  } catch (_) {
    // Fall through to DuckDuckGo search
  }

  // 2. Fallback: Search live weather via DuckDuckGo
  try {
    const query = location ? `weather today in ${location}` : 'current weather today';
    const ddg = await searchWebSnippets(query, 2);
    if (ddg.success && ddg.results.length > 0) {
      return {
        success: true,
        location: location || 'Current Location',
        summary: ddg.results.join('. ')
      };
    }
  } catch (_) {}

  return {
    success: false,
    error: 'Could not retrieve live weather at this moment.'
  };
}

/**
 * Free, Zero-API-Key Real-time DuckDuckGo Web Searcher
 * Scrapes top live web result snippets without any keys or quotas
 */
export async function searchWebSnippets(query, maxResults = 4) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Search provider returned HTTP ${res.status}`);
    }

    const html = await res.text();
    const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    const snippets = [];
    let match;

    while ((match = regex.exec(html)) !== null && snippets.length < maxResults) {
      const cleanSnippet = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, '&')
        .trim();

      if (cleanSnippet) {
        snippets.push(cleanSnippet);
      }
    }

    return {
      success: true,
      query,
      results: snippets
    };
  } catch (err) {
    return {
      success: false,
      query,
      results: [],
      error: err.message
    };
  }
}

/**
 * Grounded AI Search Answer Generator
 * Feeds verified live data into local Ollama (gemma3:4b) for conversational synthesis
 */
export async function askLiveSearchAI(query) {
  if (!query || typeof query !== 'string') {
    return { success: false, reply: 'Please provide a valid question.' };
  }

  const cleanQuery = query.trim();
  const lower = cleanQuery.toLowerCase();
  const isWeather = /\b(weather|temperature|forecast|is it raining|how cold|how hot|climate)\b/i.test(lower);

  // 1. WEATHER BRANCH
  if (isWeather) {
    const cityMatch = cleanQuery.match(/(?:in|for|at)\s+([a-zA-Z\s]+?)(?:\?|$|\.|\,)/i);
    const requestedCity = cityMatch ? cityMatch[1].replace(/today|now|tomorrow|tonight/gi, '').trim() : '';

    const weather = await getLiveWeather(requestedCity);

    if (!weather.success) {
      return {
        success: false,
        action: 'SEARCH',
        category: 'weather',
        reply: weather.error || 'Sorry, I could not connect to live weather right now.'
      };
    }

    const prompt = `You are Moco AI, a friendly desktop HUD assistant.
Verified Live Weather:
${weather.summary}

User Query: "${cleanQuery}"
Provide a friendly, conversational 1-2 sentence response informing the user of the current weather. Do not use markdown headers.`;

    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          action: 'SEARCH',
          category: 'weather',
          reply: (data.response || weather.summary).trim(),
          data: weather
        };
      }
    } catch (_) {}

    return {
      success: true,
      action: 'SEARCH',
      category: 'weather',
      reply: weather.summary,
      data: weather
    };
  }

  // 2. GENERAL WEB SEARCH BRANCH
  const searchResults = await searchWebSnippets(cleanQuery);
  const snippetsText = searchResults.results.map((s, i) => `[${i + 1}] ${s}`).join('\n');

  if (!snippetsText) {
    return {
      success: true,
      action: 'SEARCH',
      category: 'web',
      reply: `I searched the web for "${cleanQuery}", but could not find relevant snippets.`
    };
  }

  const prompt = `You are Moco AI, an intelligent desktop assistant.
Answer the user's question accurately using this real-time web search information:
User Question: "${cleanQuery}"

Live Web Search Context:
${snippetsText}

Provide a concise, direct, helpful 1-2 sentence response grounded strictly in the live search context.`;

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt,
        stream: false
      })
    });

    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        action: 'SEARCH',
        category: 'web',
        reply: (data.response || snippetsText).trim(),
        data: searchResults
      };
    }
  } catch (_) {}

  return {
    success: true,
    action: 'SEARCH',
    category: 'web',
    reply: searchResults.results[0] || 'Found search results.',
    data: searchResults
  };
}
