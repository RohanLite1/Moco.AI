import { askLiveSearchAI, getLiveWeather, searchWebSnippets } from '../services/searchService.js';

async function runTests() {
  console.log('--- 1. Testing Live Weather Retrieval ---');
  const w1 = await getLiveWeather();
  console.log('Weather (Auto):', w1.location, 'Temp:', w1.tempC, 'C, Condition:', w1.condition);

  console.log('\n--- 2. Testing DuckDuckGo Web Snippets ---');
  const s1 = await searchWebSnippets('latest technological innovations');
  console.log('Snippets found:', s1.results.length);
  if (s1.results.length) console.log('Snippet 1:', s1.results[0].slice(0, 100) + '...');

  console.log('\n--- 3. Testing Grounded AI Answer for Weather ---');
  const aiWeather = await askLiveSearchAI('what is the weather like today?');
  console.log('AI Weather Reply:', aiWeather.reply);

  console.log('\n--- 4. Testing Grounded AI Answer for Specific City ---');
  const aiParis = await askLiveSearchAI('how is the weather in Paris?');
  console.log('AI Paris Reply:', aiParis.reply);
}

runTests().catch(console.error);
