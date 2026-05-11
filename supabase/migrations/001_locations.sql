-- Tabella locations: traccia la posizione in tempo reale degli utenti
CREATE TABLE IF NOT EXISTS public.locations (
  user_id   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lat       DOUBLE PRECISION NOT NULL,
  lng       DOUBLE PRECISION NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice spaziale per query di prossimità future
CREATE INDEX IF NOT EXISTS idx_locations_lat_lng ON public.locations (lat, lng);

-- Row Level Security: ogni utente vede solo la propria riga (per ora)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policy: l'utente può leggere e scrivere solo la propria posizione
CREATE POLICY "locations_self_read" ON public.locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "locations_self_upsert" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "locations_self_update" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy aggiuntiva: gli utenti autenticati vedono le posizioni degli altri
-- (necessaria per il Social Layer — Fase 1 MVP)
CREATE POLICY "locations_read_others" ON public.locations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Funzione helper per pulire i giocatori offline (last_seen > 5 minuti)
CREATE OR REPLACE FUNCTION public.cleanup_stale_locations()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.locations WHERE last_seen < NOW() - INTERVAL '5 minutes';
$$;

-- Opzionale: cron job via pg_cron (attivare da Supabase Dashboard)
-- SELECT cron.schedule('cleanup-stale-locations', '*/5 * * * *', 'SELECT public.cleanup_stale_locations()');
