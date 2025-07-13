-- Add consultation_notes column to appointments table for dentist summaries
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS consultation_notes TEXT;