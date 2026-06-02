export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { type, content, products, dossiers } = req.body || {};
  if (!type || !content) { res.status(400).json({ error: 'type en content zijn verplicht' }); return; }

  try {
    let prompt = '';

    if (type === 'excel') {
      prompt = `Je bent een inkoop data analist. Analyseer deze Excel data van een PPS/PS sample tracking lijst en extraheer alle order regels.

Excel inhoud:
${content}

Bestaande producten in het systeem (artikelcode → dossier_id):
${JSON.stringify(products)}

Geef ALLEEN een JSON array terug (geen markdown, geen uitleg) met objecten:
{
  "dossier_id": "uuid van het dossier als artikelcode matcht, anders null",
  "shi_code": "artikelcode bijv 75.023.76",
  "product_name": "productnaam",
  "order_number": "ordernummer bijv 4500303927",
  "pps_sent_date": "datum in YYYY-MM-DD formaat of null",
  "pps_approved_date": "datum in YYYY-MM-DD formaat of null", 
  "pps_status": "Akkoord als goedgekeurd, Verstuurd als verstuurd maar geen akkoord, NVT als NVT, Openstaand als leeg",
  "ps_sent_date": "datum in YYYY-MM-DD formaat of null",
  "ps_approved_date": "datum in YYYY-MM-DD formaat of null",
  "ps_status": "Akkoord als goedgekeurd, Verstuurd als verstuurd maar geen akkoord, NVT als NVT, Openstaand als leeg",
  "notes": "eventuele opmerkingen of null"
}

Let op datums: Excel slaat datums soms op als nummers (bijv 45085 = dagen sinds 1-1-1900). Converteer deze naar echte datums.
Geef alle orders terug die je kunt vinden.`;
    } else if (type === 'pdf') {
      prompt = `Analyseer deze purchase order tekst en extraheer de order informatie.

PO tekst:
${content}

Bestaande dossiers (shi_code → dossier_id):
${JSON.stringify(dossiers)}

Geef ALLEEN een JSON object terug (geen markdown, geen uitleg):
{
  "dossier_id": "uuid als shi_code matcht in de dossiers lijst, anders null",
  "shi_code": "SHI artikelcode bijv 75.023.76",
  "product_name": "productnaam",
  "order_number": "PO nummer bijv 4500303929",
  "delivery_date": "leverdatum in YYYY-MM-DD formaat of null",
  "supplier": "leveranciersnaam",
  "fob_price": "prijs per 100 stuks of per stuk als getal",
  "volume": "aantal stuks als getal",
  "notes": "eventuele bijzonderheden of null"
}`;
    }

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await aiRes.json();
    if (!aiRes.ok) throw new Error(data.error?.message || 'AI fout');

    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json({ result: parsed });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Onbekende fout' });
  }
}
