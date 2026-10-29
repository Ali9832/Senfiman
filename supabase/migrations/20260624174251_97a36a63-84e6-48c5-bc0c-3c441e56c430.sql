
-- Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warden';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'services';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warehouse';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'council_secretary';

-- Ticket enums
DO $$ BEGIN
  CREATE TYPE public.ticket_category AS ENUM ('facilities','services','safety','admin','complaint');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_priority AS ENUM ('critical','high','medium','low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM (
    'submitted','pending_warden','assigned','awaiting_student_time',
    'in_progress','needs_items','items_requested','items_ready',
    'completed','closed','reopened','rejected','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.complaint_kind AS ENUM ('complaint','criticism','suggestion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.complaint_status AS ENUM ('open','in_review','resolved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.item_request_status AS ENUM ('requested','fulfilled','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
