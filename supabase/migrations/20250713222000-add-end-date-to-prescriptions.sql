-- Add end_date column to track when prescriptions end
ALTER TABLE public.prescriptions ADD COLUMN end_date DATE;
