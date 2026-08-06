import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUp, Trash2 } from "lucide-react";
import { SPONSOR_KEYS, useSponsorBanners } from "@/lib/use-sponsors";

type Slot = "desktop" | "mobile";

const SPECS: Record<Slot, { label: string; size: string; note: string }> = {
  desktop: {
    label: "Desktop banner",
    size: "2400 × 600 px (4:1)",
    note: "Shown on tablets and computers. Keep logos inside the middle 90% and use PNG/JPG/WebP under 1 MB.",
  },
  mobile: {
    label: "Mobile banner",
    size: "1080 × 1350 px (4:5)",
    note: "Shown on phones. A taller, stacked layout of the same sponsor logos works best.",
  },
};

export function SponsorsAdmin() {
  const { desktop, mobile, paths, reload } = useSponsorBanners();
  const [busy, setBusy] = useState<Slot | null>(null);
  const inputs = { desktop: useRef<HTMLInputElement>(null), mobile: useRef<HTMLInputElement>(null) };

  async function upload(slot: Slot, file: File) {
    setBusy(slot);
    const ext = file.name.split(".").pop() || "png";
    const path = `${slot}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("sponsors").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    if (upErr) {
      setBusy(null);
      return toast.error(upErr.message);
    }
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: SPONSOR_KEYS[slot], value: path, updated_at: new Date().toISOString() });
    setBusy(null);
    if (error) return toast.error(error.message);
    const old = paths[slot];
    if (old && old !== path) await supabase.storage.from("sponsors").remove([old]);
    toast.success(`${SPECS[slot].label} updated`);
    reload();
  }

  async function clear(slot: Slot) {
    if (!confirm(`Remove the ${SPECS[slot].label.toLowerCase()}?`)) return;
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: SPONSOR_KEYS[slot], value: null, updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    const old = paths[slot];
    if (old) await supabase.storage.from("sponsors").remove([old]);
    toast.success("Removed");
    reload();
  }

  const previews: Record<Slot, string | null> = { desktop, mobile };

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {(["desktop", "mobile"] as const).map((slot) => (
        <div key={slot} className="rounded-2xl border border-border bg-card/60 p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold">{SPECS[slot].label}</h3>
              <p className="mt-1 text-xs text-neon-blue">Recommended: {SPECS[slot].size}</p>
              <p className="mt-1 text-xs text-muted-foreground">{SPECS[slot].note}</p>
            </div>
            {previews[slot] && (
              <button
                onClick={() => clear(slot)}
                className="shrink-0 rounded-md border border-border p-2 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${slot} banner`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/30">
            {previews[slot] ? (
              <img src={previews[slot]!} alt={`${SPECS[slot].label} preview`} className="w-full" />
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                No banner uploaded
              </div>
            )}
          </div>

          <input
            ref={inputs[slot]}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(slot, f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => inputs[slot].current?.click()}
            disabled={busy === slot}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-gradient-neon px-4 py-2 text-xs font-semibold text-primary-foreground shadow-neon-purple disabled:opacity-60"
          >
            <ImageUp className="h-4 w-4" />
            {busy === slot ? "Uploading…" : previews[slot] ? "Replace image" : "Upload image"}
          </button>
        </div>
      ))}
    </div>
  );
}
