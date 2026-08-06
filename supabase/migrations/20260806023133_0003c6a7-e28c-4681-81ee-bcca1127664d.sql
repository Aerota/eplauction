CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_content_public_read" ON public.site_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_content_admin_write" ON public.site_content FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "sponsors_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'sponsors');
CREATE POLICY "sponsors_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sponsors' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sponsors_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'sponsors' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sponsors_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sponsors' AND public.has_role(auth.uid(), 'admin'));