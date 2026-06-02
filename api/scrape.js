export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
 
  const { url } = req.body || {};
  if (!url) { res.status(400).json({ error: 'URL is verplicht' }); return; }
 
  try {
    // Fetch the page
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000)
    });
 
    if (!pageRes.ok) throw new Error(`Pagina niet bereikbaar (${pageRes.status})`);
 
    const html = await pageRes.text();
 
    // Strip HTML to plain text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 4000)
      .trim();
 
    // Send to Claude
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyseer deze productpagina tekst en geef ALLEEN een JSON object terug (geen markdown, geen uitleg) met:
- name: productnaam (kort en specifiek, Nederlands)
- category: kies uit: Audio | Kabels & accessoires | Powerbanks & laders | Solar | Gaming | Trending / TikTok | Overig
- specs: compacte opsomming van de belangrijkste specs in het Nederlands (max 4 regels, gebruik komma's)
 
Paginatekst: ${text}`
        }]
      })
    });
 
    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'AI fout');
 
    const aiText = aiData.content?.[0]?.text || '';
    const clean = aiText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
 
    res.status(200).json(parsed);
 
  } catch (e) {
    res.status(500).json({ error: e.message || 'Onbekende fout' });
  }
}
