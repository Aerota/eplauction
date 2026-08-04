import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Match } from "@/lib/matches";

/** Live-updating single match. */
export function useMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!matchId) return;
    const { data } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
    setMatch((data ?? null) as Match | null);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (!matchId) return;
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  return { match, loading, reload: load };
}
