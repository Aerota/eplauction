
-- Move PII (email, phone) out of players into a protected table
CREATE TABLE public.player_contacts (
  player_id uuid PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_contacts TO authenticated;
GRANT ALL ON public.player_contacts TO service_role;

ALTER TABLE public.player_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin can view player contacts"
  ON public.player_contacts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Owner can insert own player contacts"
  ON public.player_contacts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Owner or admin can update player contacts"
  ON public.player_contacts FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Admin can delete player contacts"
  ON public.player_contacts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Migrate existing data
INSERT INTO public.player_contacts (player_id, email, phone)
SELECT id, email, phone FROM public.players
WHERE email IS NOT NULL OR phone IS NOT NULL;

-- Drop PII columns from players
ALTER TABLE public.players DROP COLUMN email, DROP COLUMN phone;
