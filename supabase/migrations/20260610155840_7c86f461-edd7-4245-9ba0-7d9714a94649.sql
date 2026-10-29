CREATE TYPE public.building_kind AS ENUM ('faculty', 'dorm', 'cafeteria', 'other');

CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  kind public.building_kind NOT NULL,
  capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.buildings TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.buildings TO authenticated;
GRANT ALL ON public.buildings TO service_role;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buildings_read_all" ON public.buildings FOR SELECT USING (true);
CREATE POLICY "buildings_admin_insert" ON public.buildings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "buildings_admin_update" ON public.buildings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "buildings_admin_delete" ON public.buildings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.buildings (name, kind) VALUES
  ('دانشکده مکانیک', 'faculty'),
  ('دانشکده برق و کامپیوتر', 'faculty'),
  ('دانشکده شیمی', 'faculty'),
  ('دانشکده صنایع و مواد', 'faculty'),
  ('دانشکده عمران', 'faculty'),
  ('دانشکده علوم پایه', 'faculty'),
  ('خوابگاه امینیان', 'dorm'),
  ('خوابگاه ریحانه', 'dorm'),
  ('سلف مرکزی', 'cafeteria');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS resident_building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL;

CREATE TYPE public.locker_priority AS ENUM ('host', 'guest');

ALTER TABLE public.locker_reservations
  ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority_tier public.locker_priority;

CREATE OR REPLACE FUNCTION public.set_locker_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_building UUID;
BEGIN
  SELECT resident_building_id INTO user_building FROM public.profiles WHERE id = NEW.user_id;
  IF NEW.building_id IS NOT NULL AND user_building = NEW.building_id THEN
    NEW.priority_tier := 'host';
  ELSE
    NEW.priority_tier := 'guest';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_locker_priority() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_locker_priority
  BEFORE INSERT ON public.locker_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_locker_priority();

CREATE TYPE public.qc_location AS ENUM ('cafeteria', 'dorm', 'classroom', 'restroom');

CREATE TABLE public.qc_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  location_type public.qc_location NOT NULL,
  location_value TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
  notes TEXT,
  photo_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.qc_inspections TO authenticated;
GRANT ALL ON public.qc_inspections TO service_role;
ALTER TABLE public.qc_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qc_select_own_or_council" ON public.qc_inspections FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'council_member') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "qc_insert_own" ON public.qc_inspections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_own" ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);