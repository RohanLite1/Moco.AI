async function testSearch() {
  const query = 'artificial intelligence news';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  const html = await res.text();
  const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
  const snippets = [];
  let match;
  while ((match = regex.exec(html)) !== null && snippets.length < 4) {
    const clean = match[1].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
    if (clean) snippets.push(clean);
  }
  
  console.log('DuckDuckGo snippets count:', snippets.length);
  snippets.forEach((s, i) => console.log(`[${i+1}] ${s}`));
}

testSearch().catch(console.error);
