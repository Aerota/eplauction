CREATE POLICY "Authenticated can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Authenticated can update own images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads') WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Authenticated can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads');
CREATE POLICY "Anyone can read uploads" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'uploads');

CREATE OR REPLACE FUNCTION public.clear_current_player()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.auction_settings
    SET current_player_id = NULL, current_bid = NULL, current_bid_team_id = NULL, updated_at = now()
    WHERE id = 1;
END; $$;
REVOKE EXECUTE ON FUNCTION public.clear_current_player() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_current_player() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_auction_round(_round integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  IF _round < 0 OR _round > 3 THEN RAISE EXCEPTION 'Round must be between 0 and 3'; END IF;
  UPDATE public.auction_settings SET auction_round = _round, updated_at = now() WHERE id = 1;
END; $$;
REVOKE EXECUTE ON FUNCTION public.set_auction_round(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_auction_round(integer) TO authenticated;