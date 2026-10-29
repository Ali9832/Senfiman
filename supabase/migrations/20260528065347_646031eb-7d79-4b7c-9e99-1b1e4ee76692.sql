
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('student', 'council_member', 'admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  student_code TEXT UNIQUE,
  faculty TEXT,
  major TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  faculty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, student_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'student_code'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Meal transfers (QR)
CREATE TYPE public.meal_kind AS ENUM ('lunch', 'dinner');
CREATE TYPE public.transfer_status AS ENUM ('pending', 'approved', 'rejected', 'consumed', 'expired');
CREATE TYPE public.transfer_type AS ENUM ('send', 'request');

CREATE TABLE public.meal_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  receiver_student_code TEXT NOT NULL,
  receiver_last_name TEXT NOT NULL,
  meal_date DATE NOT NULL,
  meal_kind public.meal_kind NOT NULL,
  meal_name TEXT,
  transfer_type public.transfer_type NOT NULL DEFAULT 'send',
  status public.transfer_status NOT NULL DEFAULT 'pending',
  qr_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE ON public.meal_transfers TO authenticated;
GRANT ALL ON public.meal_transfers TO service_role;
ALTER TABLE public.meal_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transfers_select_involved" ON public.meal_transfers FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "transfers_insert_own" ON public.meal_transfers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "transfers_update_involved" ON public.meal_transfers FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 3 transfers per week limit (trigger)
CREATE OR REPLACE FUNCTION public.check_weekly_transfer_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.meal_transfers
   WHERE sender_id = NEW.sender_id
     AND created_at >= date_trunc('week', now());
  IF cnt >= 3 THEN
    RAISE EXCEPTION 'محدودیت ۳ انتقال در هفته رد شد';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_weekly_transfer_limit
  BEFORE INSERT ON public.meal_transfers
  FOR EACH ROW EXECUTE FUNCTION public.check_weekly_transfer_limit();

-- Locker reservations
CREATE TYPE public.locker_status AS ENUM ('pending_payment', 'pending_approval', 'approved', 'rejected', 'expired');
CREATE TYPE public.locker_plan AS ENUM ('m1', 'm2', 'm3', 'semester');

CREATE TABLE public.locker_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locker_number TEXT NOT NULL,
  building TEXT NOT NULL,
  plan public.locker_plan NOT NULL,
  price INTEGER NOT NULL,
  status public.locker_status NOT NULL DEFAULT 'pending_payment',
  receipt_path TEXT,
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_note TEXT,
  starts_at DATE,
  ends_at DATE,
  payment_deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.locker_reservations TO authenticated;
GRANT ALL ON public.locker_reservations TO service_role;
ALTER TABLE public.locker_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locker_select_own_or_council" ON public.locker_reservations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'council_member'));
CREATE POLICY "locker_insert_own" ON public.locker_reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "locker_update_own_or_council" ON public.locker_reservations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'council_member'));

-- Locker bans (2-week penalty for fake receipts)
CREATE TABLE public.locker_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  banned_until TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.locker_bans TO authenticated;
GRANT INSERT ON public.locker_bans TO authenticated;
GRANT ALL ON public.locker_bans TO service_role;
ALTER TABLE public.locker_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ban_select_own_or_council" ON public.locker_bans FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'council_member'));
CREATE POLICY "ban_insert_council" ON public.locker_bans FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'council_member'));

-- Ticket attachments
CREATE TABLE public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.ticket_attachments TO authenticated;
GRANT ALL ON public.ticket_attachments TO service_role;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attach_select_own_or_council" ON public.ticket_attachments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'council_member'));
CREATE POLICY "attach_insert_own" ON public.ticket_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attach_delete_own" ON public.ticket_attachments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('locker-receipts', 'locker-receipts', false),
  ('ticket-attachments', 'ticket-attachments', false),
  ('meal-qr', 'meal-qr', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "receipts_owner_rw" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'locker-receipts' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'council_member')))
  WITH CHECK (bucket_id = 'locker-receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ticket_owner_rw" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ticket-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'council_member')))
  WITH CHECK (bucket_id = 'ticket-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "qr_involved_rw" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'meal-qr')
  WITH CHECK (bucket_id = 'meal-qr');
