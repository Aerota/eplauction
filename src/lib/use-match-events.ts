import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MatchEvent } from "@/lib/matches";

/** Live-updating ball-by-ball feed for a single match. */
export function useMatchEvents(matchId: string | undefined) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!matchId) return;
    const { data } = await supabase
      .from("match_events")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false });
    setEvents((data ?? []) as MatchEvent[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!matchId) return;
    const channel = supabase
      .channel(`match-events-${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_events", filter: `match_id=eq.${matchId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return { events, loading, reload: load };
}
