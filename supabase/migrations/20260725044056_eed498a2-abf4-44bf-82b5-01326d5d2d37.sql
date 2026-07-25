
-- 1. players: remove public SELECT, add authenticated-only SELECT; tighten insert
DROP POLICY IF EXISTS "Anyone can view players" ON public.players;
CREATE POLICY "Authenticated can view players" ON public.players
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can register as player" ON public.players;
CREATE POLICY "Users can register themselves as player" ON public.players
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

REVOKE SELECT ON public.players FROM anon;

-- 2. auction_settings: authenticated-only SELECT
DROP POLICY IF EXISTS "Anyone can view auction settings" ON public.auction_settings;
CREATE POLICY "Authenticated can view auction settings" ON public.auction_settings
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.auction_settings FROM anon;

-- 3. bids: authenticated-only SELECT
DROP POLICY IF EXISTS "Anyone can view bids" ON public.bids;
CREATE POLICY "Authenticated can view bids" ON public.bids
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.bids FROM anon;

-- 4. teams: remove public SELECT (authenticated-only policy already exists)
DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;
REVOKE SELECT ON public.teams FROM anon;

-- 5. profiles: restrict to own row or admin
DROP POLICY IF EXISTS "Profiles are viewable by authenticated" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- 6. Revoke EXECUTE on SECURITY DEFINER functions from anon / PUBLIC.
--    Admin-only functions still self-check via has_role; authenticated
--    EXECUTE is required so admins (who authenticate as regular users) can call them.
REVOKE EXECUTE ON FUNCTION public.claim_admin_role() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_bid(numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_auction_live(boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_player(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sell_current_player() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_current_unsold() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_next_round() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pre_assign_player(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_player_assignment(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, PUBLIC;
