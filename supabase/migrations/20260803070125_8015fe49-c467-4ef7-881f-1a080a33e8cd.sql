CREATE TYPE public.match_status AS ENUM ('upcoming', 'live', 'completed');

CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_name text NOT NULL,
  team_b_name text NOT NULL,
  team_a_logo_url text,
  team_b_logo_url text,
  venue text,
  match_date timestamptz,
  status public.match_status NOT NULL DEFAULT 'upcoming',
  team_a_score integer NOT NULL DEFAULT 0,
  team_a_wickets integer NOT NULL DEFAULT 0,
  team_a_overs numeric NOT NULL DEFAULT 0,
  team_b_score integer NOT NULL DEFAULT 0,
  team_b_wickets integer NOT NULL DEFAULT 0,
  team_b_overs numeric NOT NULL DEFAULT 0,
  current_innings integer NOT NULL DEFAULT 1,
  batting_team text,
  toss_info text,
  commentary text,
  result_summary text,
  youtube_url text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update matches" ON public.matches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete matches" ON public.matches FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;