import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "team_manager" | "player";

export function useMyRoles() {
  const [roles, setRoles] = useState<AppRole[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      if (!mounted) return;
      setUserId(userData.user.id);
      setEmail(userData.user.email ?? null);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (mounted) setRoles((data ?? []).map((r) => r.role as AppRole));
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { roles, userId, email, isAdmin: roles?.includes("admin") ?? false };
}
