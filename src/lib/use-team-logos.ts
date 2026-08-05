import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Map of team name (lowercased) -> logo uploaded by the team manager.
 * Falls back to an empty map for signed-out visitors (teams are auth-only).
 */
export function useTeamLogos() {
  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("teams").select("team_name, logo_url");
      if (!active || !data) return;
      const map: Record<string, string> = {};
      for (const t of data) {
        if (t.logo_url) map[t.team_name.trim().toLowerCase()] = t.logo_url;
      }      
      setLogos(map);
    })();
    return () => {
      active = false;
    };
  }, []);

  /** Prefer the manager-uploaded team logo, fall back to any logo stored on the match. */
  function logoFor(teamName: string, fallback?: string | null) {
    return logos[teamName.trim().toLowerCase()] ?? fallback ?? null;
  }

  return { logos, logoFor };
}
