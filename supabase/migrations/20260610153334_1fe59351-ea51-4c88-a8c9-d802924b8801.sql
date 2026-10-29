-- Phase 2: library loans + internet quota

CREATE TABLE public.library_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  loan_date DATE,
  due_date DATE NOT NULL,
  returned BOOLEAN NOT NULL DEFAULT false,
  external_id TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_loans TO authenticated;
GRANT ALL ON public.library_loans TO service_role;

ALTER TABLE public.library_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view their own loans" ON public.library_loans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users manage their own loans" ON public.library_loans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_library_loans_user_due ON public.library_loans(user_id, due_date);


CREATE TABLE public.internet_usage (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  used_mb BIGINT NOT NULL DEFAULT 0,
  total_mb BIGINT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internet_usage TO authenticated;
GRANT ALL ON public.internet_usage TO service_role;

ALTER TABLE public.internet_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view their own quota" ON public.internet_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users manage their own quota" ON public.internet_usage
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);