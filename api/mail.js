export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
 
  const { prompt } = req.body || {};
  if (!prompt) { res.status(400).json({ error: 'Prompt is verplicht' }); return; }
 
  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });
 
    const data = await aiRes.json();
    if (!aiRes.ok) throw new Error(data.error?.message || 'AI fout');
 
    const text = data.content?.[0]?.text || '';
    res.status(200).json({ text });
 
  } catch (e) {
    res.status(500).json({ error: e.message || 'Onbekende fout' });
  }
}
