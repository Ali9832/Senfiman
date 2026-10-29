
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.ticket_category NOT NULL DEFAULT 'facilities',
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  published BOOLEAN NOT NULL DEFAULT true,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_articles TO authenticated;
GRANT ALL ON public.kb_articles TO service_role;

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_read_published" ON public.kb_articles FOR SELECT TO authenticated
  USING (published = true OR public.is_central_council(auth.uid()));

CREATE POLICY "kb_admin_insert" ON public.kb_articles FOR INSERT TO authenticated
  WITH CHECK (public.is_central_council(auth.uid()));

CREATE POLICY "kb_admin_update" ON public.kb_articles FOR UPDATE TO authenticated
  USING (public.is_central_council(auth.uid()))
  WITH CHECK (public.is_central_council(auth.uid()));

CREATE POLICY "kb_admin_delete" ON public.kb_articles FOR DELETE TO authenticated
  USING (public.is_central_council(auth.uid()));

CREATE TRIGGER kb_touch BEFORE UPDATE ON public.kb_articles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
