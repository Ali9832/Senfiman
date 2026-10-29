
-- =========================
-- TICKETS
-- =========================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id),
  room_no TEXT,
  category public.ticket_category NOT NULL,
  priority_suggested public.ticket_priority NOT NULL DEFAULT 'medium',
  priority_final public.ticket_priority,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'submitted',
  warden_id UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  sla_due_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  satisfaction SMALLINT CHECK (satisfaction BETWEEN 1 AND 5),
  satisfaction_note TEXT,
  reopen_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- =========================
-- TICKET EVENTS (audit log)
-- =========================
CREATE TABLE public.ticket_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  from_status public.ticket_status,
  to_status public.ticket_status,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_events TO authenticated;
GRANT ALL ON public.ticket_events TO service_role;
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;

-- =========================
-- TICKET COMMENTS
-- =========================
CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_comments TO authenticated;
GRANT ALL ON public.ticket_comments TO service_role;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- =========================
-- TICKET SCHEDULES
-- =========================
CREATE TABLE public.ticket_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES auth.users(id),
  proposed_at TIMESTAMPTZ NOT NULL,
  student_confirmed BOOLEAN,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_schedules TO authenticated;
GRANT ALL ON public.ticket_schedules TO service_role;
ALTER TABLE public.ticket_schedules ENABLE ROW LEVEL SECURITY;

-- =========================
-- ITEM REQUESTS
-- =========================
CREATE TABLE public.item_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  items JSONB NOT NULL,
  notes TEXT,
  status public.item_request_status NOT NULL DEFAULT 'requested',
  fulfilled_by UUID REFERENCES auth.users(id),
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_requests TO authenticated;
GRANT ALL ON public.item_requests TO service_role;
ALTER TABLE public.item_requests ENABLE ROW LEVEL SECURITY;

-- =========================
-- COMPLAINTS
-- =========================
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  kind public.complaint_kind NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status public.complaint_status NOT NULL DEFAULT 'open',
  assigned_secretary UUID REFERENCES auth.users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX ON public.tickets (created_by);
CREATE INDEX ON public.tickets (warden_id);
CREATE INDEX ON public.tickets (assigned_to);
CREATE INDEX ON public.tickets (status);
CREATE INDEX ON public.tickets (building_id);
CREATE INDEX ON public.ticket_events (ticket_id);
CREATE INDEX ON public.ticket_comments (ticket_id);
CREATE INDEX ON public.notifications (user_id, read_at);
CREATE INDEX ON public.item_requests (status);

-- =========================
-- HELPER FUNCTION: can the current user see this ticket?
-- =========================
CREATE OR REPLACE FUNCTION public.can_view_ticket(_ticket_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = _ticket_id AND (
      t.created_by = auth.uid()
      OR t.assigned_to = auth.uid()
      OR t.warden_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'council_secretary')
      OR (public.has_role(auth.uid(), 'warehouse') AND EXISTS (SELECT 1 FROM public.item_requests ir WHERE ir.ticket_id = t.id))
    )
  );
$$;
REVOKE EXECUTE ON FUNCTION public.can_view_ticket(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_ticket(UUID) TO authenticated;

-- =========================
-- POLICIES: tickets
-- =========================
CREATE POLICY "tickets_select" ON public.tickets FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR warden_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'council_secretary')
  OR (public.has_role(auth.uid(), 'warehouse')
      AND EXISTS (SELECT 1 FROM public.item_requests ir WHERE ir.ticket_id = tickets.id))
);

CREATE POLICY "tickets_insert_self" ON public.tickets FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "tickets_update" ON public.tickets FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR warden_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'warden')
)
WITH CHECK (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR warden_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'warden')
);

CREATE POLICY "tickets_delete_admin" ON public.tickets FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- POLICIES: ticket_events
-- =========================
CREATE POLICY "ticket_events_select" ON public.ticket_events FOR SELECT TO authenticated
USING (public.can_view_ticket(ticket_id));

CREATE POLICY "ticket_events_insert" ON public.ticket_events FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid() AND public.can_view_ticket(ticket_id));

-- =========================
-- POLICIES: ticket_comments
-- =========================
CREATE POLICY "ticket_comments_select" ON public.ticket_comments FOR SELECT TO authenticated
USING (
  public.can_view_ticket(ticket_id)
  AND (NOT is_internal OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
       OR public.has_role(auth.uid(),'warden') OR public.has_role(auth.uid(),'services'))
);
CREATE POLICY "ticket_comments_insert" ON public.ticket_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.can_view_ticket(ticket_id));
CREATE POLICY "ticket_comments_update_own" ON public.ticket_comments FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ticket_comments_delete_own" ON public.ticket_comments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================
-- POLICIES: ticket_schedules
-- =========================
CREATE POLICY "ticket_schedules_select" ON public.ticket_schedules FOR SELECT TO authenticated
USING (public.can_view_ticket(ticket_id));
CREATE POLICY "ticket_schedules_insert" ON public.ticket_schedules FOR INSERT TO authenticated
WITH CHECK (public.can_view_ticket(ticket_id));
CREATE POLICY "ticket_schedules_update" ON public.ticket_schedules FOR UPDATE TO authenticated
USING (public.can_view_ticket(ticket_id)) WITH CHECK (public.can_view_ticket(ticket_id));

-- =========================
-- POLICIES: item_requests
-- =========================
CREATE POLICY "item_requests_select" ON public.item_requests FOR SELECT TO authenticated
USING (
  requested_by = auth.uid()
  OR public.has_role(auth.uid(), 'warehouse')
  OR public.has_role(auth.uid(), 'warden')
  OR public.has_role(auth.uid(), 'admin')
  OR public.can_view_ticket(ticket_id)
);
CREATE POLICY "item_requests_insert" ON public.item_requests FOR INSERT TO authenticated
WITH CHECK (requested_by = auth.uid() AND (
  public.has_role(auth.uid(),'warden') OR public.has_role(auth.uid(),'services') OR public.has_role(auth.uid(),'admin')
));
CREATE POLICY "item_requests_update" ON public.item_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'warehouse')
  OR public.has_role(auth.uid(), 'admin')
  OR requested_by = auth.uid()
) WITH CHECK (
  public.has_role(auth.uid(), 'warehouse')
  OR public.has_role(auth.uid(), 'admin')
  OR requested_by = auth.uid()
);

-- =========================
-- POLICIES: complaints
-- =========================
CREATE POLICY "complaints_select" ON public.complaints FOR SELECT TO authenticated
USING (
  (NOT is_anonymous AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'council_secretary')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "complaints_insert" ON public.complaints FOR INSERT TO authenticated
WITH CHECK (
  (is_anonymous = true AND created_by IS NULL)
  OR (is_anonymous = false AND created_by = auth.uid())
);
CREATE POLICY "complaints_update" ON public.complaints FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'council_secretary') OR public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'council_secretary') OR public.has_role(auth.uid(),'admin'));

-- =========================
-- POLICIES: notifications
-- =========================
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =========================
-- TRIGGER FUNCTIONS
-- =========================

-- SLA defaults & warden auto-assign
CREATE OR REPLACE FUNCTION public.tickets_set_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prio public.ticket_priority;
  hours INT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    prio := COALESCE(NEW.priority_final, NEW.priority_suggested, 'medium');
    hours := CASE prio
      WHEN 'critical' THEN 2
      WHEN 'high' THEN 12
      WHEN 'medium' THEN 48
      WHEN 'low' THEN 120
    END;
    NEW.sla_due_at := COALESCE(NEW.sla_due_at, now() + (hours || ' hours')::interval);
    -- auto-assign warden from any user with 'warden' role in same building
    IF NEW.warden_id IS NULL AND NEW.building_id IS NOT NULL THEN
      SELECT p.id INTO NEW.warden_id
      FROM public.profiles p
      JOIN public.user_roles ur ON ur.user_id = p.id AND ur.role = 'warden'
      WHERE p.resident_building_id = NEW.building_id
      LIMIT 1;
    END IF;
    NEW.status := COALESCE(NEW.status, 'pending_warden');
    IF NEW.status = 'submitted' THEN NEW.status := 'pending_warden'; END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.tickets_set_defaults() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_tickets_set_defaults
BEFORE INSERT OR UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.tickets_set_defaults();

-- Audit log + notifications
CREATE OR REPLACE FUNCTION public.tickets_log_and_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor UUID := auth.uid();
  recipients UUID[];
  r UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_events(ticket_id, actor_id, action, to_status, note)
    VALUES (NEW.id, actor, 'created', NEW.status, NEW.title);
    IF NEW.warden_id IS NOT NULL THEN
      INSERT INTO public.notifications(user_id, ticket_id, title, body, link)
      VALUES (NEW.warden_id, NEW.id, 'تیکت جدید', NEW.title, '/warden/tickets');
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.ticket_events(ticket_id, actor_id, action, from_status, to_status)
    VALUES (NEW.id, actor, 'status_change', OLD.status, NEW.status);

    recipients := ARRAY[NEW.created_by];
    IF NEW.assigned_to IS NOT NULL THEN recipients := recipients || NEW.assigned_to; END IF;
    IF NEW.warden_id IS NOT NULL THEN recipients := recipients || NEW.warden_id; END IF;

    FOREACH r IN ARRAY recipients LOOP
      IF r IS NOT NULL AND r <> actor THEN
        INSERT INTO public.notifications(user_id, ticket_id, title, body, link)
        VALUES (r, NEW.id, 'تغییر وضعیت تیکت', NEW.title || ' → ' || NEW.status::text, '/tickets/' || NEW.id::text);
      END IF;
    END LOOP;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.ticket_events(ticket_id, actor_id, action, note)
    VALUES (NEW.id, actor, 'assigned', NEW.assigned_to::text);
    INSERT INTO public.notifications(user_id, ticket_id, title, body, link)
    VALUES (NEW.assigned_to, NEW.id, 'تیکت به شما ارجاع شد', NEW.title, '/services/tickets');
  END IF;

  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.tickets_log_and_notify() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_tickets_log_and_notify
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION public.tickets_log_and_notify();

-- Item request notifications
CREATE OR REPLACE FUNCTION public.item_requests_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wh UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- notify all warehouse users
    FOR wh IN SELECT user_id FROM public.user_roles WHERE role = 'warehouse' LOOP
      INSERT INTO public.notifications(user_id, ticket_id, title, body, link)
      VALUES (wh, NEW.ticket_id, 'درخواست خرید جدید', 'بررسی و تأمین اقلام', '/warehouse/requests');
    END LOOP;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'fulfilled' AND OLD.status <> 'fulfilled' THEN
    INSERT INTO public.notifications(user_id, ticket_id, title, body, link)
    VALUES (NEW.requested_by, NEW.ticket_id, 'اقلام آماده شد', 'می‌توانید کار را ادامه دهید', '/services/tickets');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.item_requests_notify() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_item_requests_notify
AFTER INSERT OR UPDATE ON public.item_requests
FOR EACH ROW EXECUTE FUNCTION public.item_requests_notify();

-- Complaint notify secretaries
CREATE OR REPLACE FUNCTION public.complaints_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sec UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR sec IN SELECT user_id FROM public.user_roles WHERE role = 'council_secretary' LOOP
      INSERT INTO public.notifications(user_id, title, body, link)
      VALUES (sec, 'شکایت/پیشنهاد جدید', NEW.title, '/secretary/complaints');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.complaints_notify() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_complaints_notify
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.complaints_notify();

-- updated_at touchers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_item_requests_updated BEFORE UPDATE ON public.item_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER TABLE public.tickets REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
