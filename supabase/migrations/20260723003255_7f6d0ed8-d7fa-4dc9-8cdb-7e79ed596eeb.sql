
-- Enable realtime (skip auction_settings which is already a member)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.players; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.teams; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bids; EXCEPTION WHEN duplicate_object THEN NULL; END;
END$$;

ALTER TABLE public.auction_settings REPLICA IDENTITY FULL;
ALTER TABLE public.players REPLICA IDENTITY FULL;
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.bids REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.place_bid(_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_team public.teams%ROWTYPE;
  v_settings public.auction_settings%ROWTYPE;
  v_player public.players%ROWTYPE;
  v_slots_used int;
  v_min numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_team FROM public.teams WHERE manager_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'You are not a team manager'; END IF;
  SELECT * INTO v_settings FROM public.auction_settings WHERE id = 1;
  IF NOT v_settings.is_live OR v_settings.current_player_id IS NULL THEN
    RAISE EXCEPTION 'Auction is not live';
  END IF;
  SELECT * INTO v_player FROM public.players WHERE id = v_settings.current_player_id;
  IF v_player.status <> 'available' THEN RAISE EXCEPTION 'Player is not available'; END IF;
  IF v_settings.current_bid IS NULL THEN
    v_min := COALESCE(v_player.base_price, 0);
  ELSE
    v_min := v_settings.current_bid + v_settings.bid_increment;
  END IF;
  IF _amount < v_min THEN RAISE EXCEPTION 'Bid must be at least %M', v_min; END IF;
  IF _amount > v_team.budget_remaining THEN RAISE EXCEPTION 'Bid exceeds your remaining budget'; END IF;
  SELECT COUNT(*) INTO v_slots_used FROM public.players WHERE sold_to_team_id = v_team.id;
  IF v_slots_used >= v_settings.players_per_team THEN RAISE EXCEPTION 'Your squad is full'; END IF;

  INSERT INTO public.bids (player_id, team_id, amount) VALUES (v_player.id, v_team.id, _amount);
  UPDATE public.auction_settings
    SET current_bid = _amount, current_bid_team_id = v_team.id, updated_at = now()
    WHERE id = 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.place_bid(numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_current_player(_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.auction_settings
    SET current_player_id = _player_id, current_bid = NULL, current_bid_team_id = NULL,
        is_live = true, updated_at = now()
    WHERE id = 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.set_current_player(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.sell_current_player()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_settings public.auction_settings%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO v_settings FROM public.auction_settings WHERE id = 1;
  IF v_settings.current_player_id IS NULL THEN RAISE EXCEPTION 'No current player'; END IF;
  IF v_settings.current_bid IS NULL OR v_settings.current_bid_team_id IS NULL THEN
    RAISE EXCEPTION 'No bids placed';
  END IF;
  UPDATE public.players
    SET status = 'sold', sold_to_team_id = v_settings.current_bid_team_id,
        sold_price = v_settings.current_bid
    WHERE id = v_settings.current_player_id;
  UPDATE public.teams SET budget_remaining = budget_remaining - v_settings.current_bid
    WHERE id = v_settings.current_bid_team_id;
  UPDATE public.auction_settings
    SET current_player_id = NULL, current_bid = NULL, current_bid_team_id = NULL, updated_at = now()
    WHERE id = 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.sell_current_player() TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_current_unsold()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_settings public.auction_settings%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO v_settings FROM public.auction_settings WHERE id = 1;
  IF v_settings.current_player_id IS NULL THEN RAISE EXCEPTION 'No current player'; END IF;
  UPDATE public.players SET status = 'unsold', auction_round = v_settings.auction_round
    WHERE id = v_settings.current_player_id;
  UPDATE public.auction_settings
    SET current_player_id = NULL, current_bid = NULL, current_bid_team_id = NULL, updated_at = now()
    WHERE id = 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.mark_current_unsold() TO authenticated;

CREATE OR REPLACE FUNCTION public.start_next_round()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_settings public.auction_settings%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO v_settings FROM public.auction_settings WHERE id = 1;
  IF v_settings.auction_round >= 3 THEN RAISE EXCEPTION 'No more rounds'; END IF;
  UPDATE public.players SET status = 'available' WHERE status = 'unsold';
  UPDATE public.auction_settings
    SET auction_round = auction_round + 1,
        current_player_id = NULL, current_bid = NULL, current_bid_team_id = NULL, updated_at = now()
    WHERE id = 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.start_next_round() TO authenticated;

CREATE OR REPLACE FUNCTION public.pre_assign_player(_player_id uuid, _team_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.players
    SET status = 'pre_assigned', is_pre_assigned = true,
        sold_to_team_id = _team_id, sold_price = 0
    WHERE id = _player_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.pre_assign_player(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reset_player_assignment(_player_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_player public.players%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  SELECT * INTO v_player FROM public.players WHERE id = _player_id;
  IF v_player.status = 'sold' AND v_player.sold_to_team_id IS NOT NULL AND v_player.sold_price IS NOT NULL THEN
    UPDATE public.teams SET budget_remaining = budget_remaining + v_player.sold_price
      WHERE id = v_player.sold_to_team_id;
  END IF;
  UPDATE public.players
    SET status = 'available', sold_to_team_id = NULL, sold_price = NULL, is_pre_assigned = false
    WHERE id = _player_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.reset_player_assignment(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_auction_live(_live boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.auction_settings SET is_live = _live, updated_at = now() WHERE id = 1;
END; $$;
GRANT EXECUTE ON FUNCTION public.set_auction_live(boolean) TO authenticated;

DROP POLICY IF EXISTS "Anyone authenticated can view teams" ON public.teams;
CREATE POLICY "Anyone authenticated can view teams"
  ON public.teams FOR SELECT TO authenticated USING (true);
