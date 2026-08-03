import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Match } from "@/lib/matches";

/** Live-updating list of all matches (realtime enabled on the matches table). */
export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("match_date", { ascending: true, nullsFirst: false });
    setMatches((data ?? []) as Match[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("matches-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "upcoming");
  const completed = matches.filter((m) => m.status === "completed");

  return { matches, live, upcoming, completed, loading, reload: load };
}
