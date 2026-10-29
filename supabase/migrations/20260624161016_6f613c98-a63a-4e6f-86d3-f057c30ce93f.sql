
-- 1) profiles: restrict SELECT to self
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 2) user_roles: prevent self-assignment, admin-only writes
DROP POLICY IF EXISTS "roles_insert_admin" ON public.user_roles;
DROP POLICY IF EXISTS "roles_update_admin" ON public.user_roles;
DROP POLICY IF EXISTS "roles_delete_admin" ON public.user_roles;
CREATE POLICY "roles_insert_admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "roles_update_admin" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "roles_delete_admin" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) library_loans: read-only for users; writes only via service_role
DROP POLICY IF EXISTS "users manage their own loans" ON public.library_loans;
-- keep existing 'users view their own loans' SELECT policy

-- 4) internet_usage: read-only for users; writes only via service_role
DROP POLICY IF EXISTS "users manage their own quota" ON public.internet_usage;
-- keep existing 'users view their own quota' SELECT policy

-- 5) meal-qr bucket: scope to per-user folder (uid is first path segment)
DROP POLICY IF EXISTS "qr_involved_rw" ON storage.objects;
CREATE POLICY "qr_user_folder_rw" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'meal-qr'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'meal-qr'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6) has_role: tighten EXECUTE — revoke from public/anon, keep authenticated
--    (required by RLS policies that call has_role)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
