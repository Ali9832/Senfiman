
-- Helper: convenience predicate
CREATE OR REPLACE FUNCTION public.is_central_council(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid, 'central_council') OR public.has_role(_uid, 'admin')
$$;

-- Update can_view_ticket to include central_council
CREATE OR REPLACE FUNCTION public.can_view_ticket(_ticket_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = _ticket_id AND (
      t.created_by = auth.uid()
      OR t.assigned_to = auth.uid()
      OR t.warden_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'central_council')
      OR public.has_role(auth.uid(), 'council_secretary')
      OR (public.has_role(auth.uid(), 'warehouse') AND EXISTS (SELECT 1 FROM public.item_requests ir WHERE ir.ticket_id = t.id))
    )
  );
$$;

-- Super-access policies (FOR ALL) for central_council across operational tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tickets','ticket_events','ticket_comments','ticket_schedules','ticket_attachments',
    'item_requests','complaints','notifications','profiles','user_roles','buildings',
    'locker_reservations','locker_bans','meal_transfers','qc_inspections'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "central_council_all" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "central_council_all" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''central_council'')) WITH CHECK (public.has_role(auth.uid(), ''central_council''))',
      t
    );
  END LOOP;
END $$;

-- Make sure authenticated can read buildings (used in ticket form)
GRANT SELECT ON public.buildings TO authenticated;

-- Promote current user to central_council (demo login)
CREATE OR REPLACE FUNCTION public.promote_to_central_council()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'باید ابتدا وارد شوید';
  END IF;
  INSERT INTO public.user_roles(user_id, role)
  VALUES (auth.uid(), 'central_council')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.promote_to_central_council() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_to_central_council() TO authenticated;

-- Auto SLA escalation: bump priority and log event when overdue
CREATE OR REPLACE FUNCTION public.escalate_overdue_tickets()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  new_prio public.ticket_priority;
  cnt INT := 0;
BEGIN
  FOR r IN
    SELECT id, COALESCE(priority_final, priority_suggested) AS prio, sla_due_at, title, warden_id, assigned_to, created_by
    FROM public.tickets
    WHERE status NOT IN ('completed','closed','rejected')
      AND sla_due_at IS NOT NULL
      AND sla_due_at < now()
      AND COALESCE(priority_final, priority_suggested) <> 'critical'
  LOOP
    new_prio := CASE r.prio
      WHEN 'low' THEN 'medium'::public.ticket_priority
      WHEN 'medium' THEN 'high'::public.ticket_priority
      WHEN 'high' THEN 'critical'::public.ticket_priority
      ELSE 'critical'::public.ticket_priority
    END;
    UPDATE public.tickets
       SET priority_final = new_prio,
           sla_due_at = now() + CASE new_prio
             WHEN 'critical' THEN interval '2 hours'
             WHEN 'high' THEN interval '12 hours'
             WHEN 'medium' THEN interval '48 hours'
             ELSE interval '120 hours' END
     WHERE id = r.id;
    INSERT INTO public.ticket_events(ticket_id, action, note)
    VALUES (r.id, 'sla_escalation', 'تشدید خودکار اولویت به ' || new_prio::text);
    IF r.warden_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, ticket_id, title, body, link)
      VALUES (r.warden_id, r.id, 'تشدید SLA', r.title || ' → ' || new_prio::text, '/warden/tickets');
    END IF;
    IF r.assigned_to IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, ticket_id, title, body, link)
      VALUES (r.assigned_to, r.id, 'تشدید SLA', r.title || ' → ' || new_prio::text, '/services/tickets');
    END IF;
    cnt := cnt + 1;
  END LOOP;
  RETURN cnt;
END $$;
REVOKE ALL ON FUNCTION public.escalate_overdue_tickets() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.escalate_overdue_tickets() TO authenticated, service_role;
