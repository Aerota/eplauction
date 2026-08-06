import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const SPONSOR_KEYS = {
  desktop: "sponsor_banner_desktop",
  mobile: "sponsor_banner_mobile",
} as const;

const YEAR = 60 * 60 * 24 * 365;

async function signed(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("sponsors").createSignedUrl(path, YEAR);
  return data?.signedUrl ?? null;
}

export function useSponsorBanners() {
  const [desktop, setDesktop] = useState<string | null>(null);
  const [mobile, setMobile] = useState<string | null>(null);
  const [paths, setPaths] = useState<{ desktop: string | null; mobile: string | null }>({
    desktop: null,
    mobile: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_content")
      .select("key,value")
      .in("key", [SPONSOR_KEYS.desktop, SPONSOR_KEYS.mobile]);
    const map = new Map((data ?? []).map((r: any) => [r.key, r.value as string | null]));
    const d = map.get(SPONSOR_KEYS.desktop) ?? null;
    const m = map.get(SPONSOR_KEYS.mobile) ?? null;
    setPaths({ desktop: d, mobile: m });
    const [ds, ms] = await Promise.all([signed(d), signed(m)]);
    setDesktop(ds);
    setMobile(ms);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { desktop, mobile, paths, loading, reload: load };
}
