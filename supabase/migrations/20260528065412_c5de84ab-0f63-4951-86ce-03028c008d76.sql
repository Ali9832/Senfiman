
ALTER FUNCTION public.check_weekly_transfer_limit() SET search_path = public;
-- has_role and handle_new_user already have SET search_path; the EXECUTE warnings on has_role
-- are expected: RLS policies invoke it for authenticated users by design.
-- handle_new_user is only triggered by auth.users INSERT (service context), so revoke explicit grants:
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated;
