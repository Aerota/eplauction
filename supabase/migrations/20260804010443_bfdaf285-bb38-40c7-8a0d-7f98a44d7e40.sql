ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS toss_winner text,
  ADD COLUMN IF NOT EXISTS toss_decision text,
  ADD COLUMN IF NOT EXISTS highlight_url text;

CREATE TABLE IF NOT EXISTS public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings integer NOT NULL DEFAULT 1,
  over_number integer NOT NULL DEFAULT 0,
  ball_number integer NOT NULL DEFAULT 0,
  team_name text,
  runs integer NOT NULL DEFAULT 0,
  event_type text NOT NULL DEFAULT 'run',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.match_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match events" ON public.match_events
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert match events" ON public.match_events
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update match events" ON public.match_events
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete match events" ON public.match_events
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS match_events_match_id_idx ON public.match_events(match_id, created_at DESC);

ALTER TABLE public.match_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_events;