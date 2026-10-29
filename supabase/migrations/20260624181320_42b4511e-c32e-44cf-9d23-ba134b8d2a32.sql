
-- 1) Add central_council to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'central_council';
