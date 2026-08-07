import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUp, Link2 } from "lucide-react";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Image input that accepts any public image URL OR an uploaded file.
 * Uploads go to the `uploads` bucket and are stored as long-lived signed URLs,
 * so they always load even when an external URL blocks hotlinking.
 */
export function ImageField({
  label,
  value,
  onChange,
  folder = "misc",
  round = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  round?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, {
        cacheControl: "31536000",
        upsert: true,
      });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage
        .from("uploads")
        .createSignedUrl(path, TEN_YEARS);
      if (signErr || !data?.signedUrl) throw signErr ?? new Error("Could not create image link");
      setBroken(false);
      onChange(data.signedUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            inputMode="url"
            placeholder="Paste any public image URL…"
            value={value}
            onChange={(e) => {
              setBroken(false);
              onChange(e.target.value);
            }}
            className="w-full rounded-md border border-border bg-input py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-gradient-neon px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          <ImageUp className="h-4 w-4" />
          {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {hint ?? "Paste a direct link to an image, or upload one from your device."}
      </p>
      {value && (
        <div className="mt-2">
          {broken ? (
            <p className="text-[11px] text-destructive">
              That URL didn't load — it may be private or block hotlinking. Try uploading the image instead.
            </p>
          ) : (
            <img
              src={value}
              alt="Preview"
              onError={() => setBroken(true)}
              className={`h-16 w-16 object-cover ${round ? "rounded-full" : "rounded-lg"}`}
            />
          )}
        </div>
      )}
    </div>
  );
}
