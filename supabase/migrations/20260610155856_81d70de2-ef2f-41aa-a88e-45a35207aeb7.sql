CREATE POLICY "qc_photos_user_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'qc-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "qc_photos_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'qc-photos' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'council_member')
    OR public.has_role(auth.uid(), 'admin')
  ));