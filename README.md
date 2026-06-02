# SHI Sourcing Pipeline Tracker

Interne sourcing tool voor Michelle Raijmakers & Marco Tekath — Buyer Multimedia, SHI B.V.

## Wat is dit?
Een kanban-gebaseerde pipeline tracker voor alle multimedia sourcing items. Items worden opgeslagen in Supabase en zijn realtime toegankelijk voor beide buyers.

## Eenmalige setup (Supabase)
Ga naar je Supabase project → SQL Editor en voer dit uit:

```sql
CREATE TABLE sourcing_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  supplier text,
  stage text DEFAULT 'Oriëntatie',
  priority text DEFAULT 'Normaal',
  target_usd numeric,
  volume integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sourcing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON sourcing_items
  FOR ALL USING (true) WITH CHECK (true);
```

## Deployen via Vercel
1. Push deze repo naar GitHub
2. Ga naar [vercel.com](https://vercel.com) → New Project → importeer deze repo
3. Geen build settings nodig — gewoon deployen als static site
4. Deel de Vercel URL met Marco

## Fases
- Oriëntatie
- RFQ verstuurd
- Sample
- Onderhandeling
- Goedgekeurd
- On hold

## Tech
- Vanilla HTML/CSS/JS — geen dependencies, geen build stap
- Supabase (PostgreSQL + REST API) voor data opslag
- Vercel voor hosting
