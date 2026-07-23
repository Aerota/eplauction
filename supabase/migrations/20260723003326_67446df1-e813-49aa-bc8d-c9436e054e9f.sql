
REVOKE EXECUTE ON FUNCTION public.place_bid(numeric) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_player(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sell_current_player() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_current_unsold() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_next_round() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pre_assign_player(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_player_assignment(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_auction_live(boolean) FROM anon, PUBLIC;
