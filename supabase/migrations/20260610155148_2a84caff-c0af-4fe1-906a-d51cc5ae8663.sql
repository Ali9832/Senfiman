ALTER TABLE public.meal_transfers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_transfers;