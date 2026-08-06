CREATE OR REPLACE FUNCTION public.get_team_logos()
RETURNS TABLE (team_name text, logo_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.team_name, t.logo_url FROM public.teams t WHERE t.logo_url IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_team_logos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_team_logos() TO anon, authenticated;