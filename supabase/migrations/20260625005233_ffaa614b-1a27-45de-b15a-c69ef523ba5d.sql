
-- Faculty-based Quality Control inspections
CREATE TABLE public.faculty_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  faculty_id TEXT NOT NULL,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('classroom','hallway','restroom')),
  location_value TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_inspections TO authenticated;
GRANT ALL ON public.faculty_inspections TO service_role;
ALTER TABLE public.faculty_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fi_insert_own" ON public.faculty_inspections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fi_select_own_or_admin" ON public.faculty_inspections
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'central_council')
  );
CREATE POLICY "fi_admin_all" ON public.faculty_inspections
  FOR ALL TO authenticated USING (public.is_central_council(auth.uid()))
  WITH CHECK (public.is_central_council(auth.uid()));

CREATE INDEX idx_fi_faculty ON public.faculty_inspections(faculty_id);
CREATE INDEX idx_fi_user ON public.faculty_inspections(user_id);

-- Faculty Lockers (grid)
CREATE TABLE public.faculty_lockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id TEXT NOT NULL,
  number INT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (faculty_id, number)
);
GRANT SELECT ON public.faculty_lockers TO authenticated;
GRANT ALL ON public.faculty_lockers TO service_role;
ALTER TABLE public.faculty_lockers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fl_select_all" ON public.faculty_lockers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fl_admin_write" ON public.faculty_lockers
  FOR ALL TO authenticated USING (public.is_central_council(auth.uid()))
  WITH CHECK (public.is_central_council(auth.uid()));

-- Faculty Locker reservations
CREATE TABLE public.faculty_locker_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locker_id UUID NOT NULL REFERENCES public.faculty_lockers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.faculty_locker_reservations TO authenticated;
GRANT ALL ON public.faculty_locker_reservations TO service_role;
ALTER TABLE public.faculty_locker_reservations ENABLE ROW LEVEL SECURITY;

-- enforce: one active reservation per locker
CREATE UNIQUE INDEX flr_one_active_per_locker
  ON public.faculty_locker_reservations(locker_id) WHERE status = 'active';
-- enforce: one active reservation per user
CREATE UNIQUE INDEX flr_one_active_per_user
  ON public.faculty_locker_reservations(user_id) WHERE status = 'active';

-- everyone sees active reservations (to render grid state)
CREATE POLICY "flr_select_visible" ON public.faculty_locker_reservations
  FOR SELECT TO authenticated USING (
    status = 'active' OR user_id = auth.uid() OR public.is_central_council(auth.uid())
  );
CREATE POLICY "flr_insert_own" ON public.faculty_locker_reservations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'active');
CREATE POLICY "flr_cancel_own_or_admin" ON public.faculty_locker_reservations
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid() OR public.is_central_council(auth.uid())
  ) WITH CHECK (
    user_id = auth.uid() OR public.is_central_council(auth.uid())
  );

-- Seed 48 lockers per faculty, mark a few unavailable
DO $$
DECLARE
  fac TEXT;
  n INT;
BEGIN
  FOREACH fac IN ARRAY ARRAY['mechanical','electrical','chemistry','industrial','civil','basicSciences'] LOOP
    FOR n IN 1..48 LOOP
      INSERT INTO public.faculty_lockers(faculty_id, number, is_available)
      VALUES (fac, n, NOT (n IN (7, 23, 41)))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
