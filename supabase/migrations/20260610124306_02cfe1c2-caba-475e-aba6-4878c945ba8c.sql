
-- pgsodium for credential encryption
CREATE EXTENSION IF NOT EXISTS pgsodium;

CREATE TYPE public.uni_system AS ENUM ('food', 'library', 'internet');

CREATE TABLE public.university_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system public.uni_system NOT NULL,
  username TEXT NOT NULL,
  password_encrypted TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, system)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.university_credentials TO authenticated;
GRANT ALL ON public.university_credentials TO service_role;
ALTER TABLE public.university_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own credentials"
ON public.university_credentials FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.food_menu_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_menu_cache TO authenticated;
GRANT ALL ON public.food_menu_cache TO service_role;
ALTER TABLE public.food_menu_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own food cache"
ON public.food_menu_cache FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users insert own food cache"
ON public.food_menu_cache FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own food cache"
ON public.food_menu_cache FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
