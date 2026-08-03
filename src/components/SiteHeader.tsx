import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/logo_for_web.png.asset.json";

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") localStorage.removeItem("esag_intent");
    navigate({ to: "/auth" });
  }

  const onAuthPage = pathname.startsWith("/auth");

  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/favicon.png"
            alt="ESAG Premier League logo"
            className="h-12 w-auto object-contain"
          />
          <span className="font-bold tracking-tight" />
        </Link>
        <div className="flex items-center gap-3">
          {ready && email ? (
            <>
              <Link
                to="/dashboard"
                className="hidden rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:bg-muted sm:inline-flex"
              >
                Dashboard
              </Link>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {email}
              </span>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : (
            !onAuthPage && (
              <Link
                to="/auth"
                className="rounded-md bg-gradient-neon px-4 py-2 text-sm font-semibold text-primary-foreground shadow-neon-purple hover:opacity-90"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
