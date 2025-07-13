-- Add consultation_notes column to appointments table for dentist summaries
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS consultation_notes TEXT;

-- Create sample appointments with proper UUIDs
-- Note: These will only work if the dentist user actually exists from signup
-- We'll create generic sample data that can be linked to any real dentist

-- Create sample patient profiles with proper UUIDs
INSERT INTO public.profiles (
  id,
  user_id,
  email,
  first_name,
  last_name,
  role,
  phone,
  date_of_birth
) VALUES 
(
  gen_random_uuid(),
  gen_random_uuid(),
  'john.doe@example.com',
  'John',
  'Doe',
  'patient',
  '+1-555-0123',
  '1985-03-15'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'jane.smith@example.com',
  'Jane',
  'Smith',
  'patient',
  '+1-555-0124',
  '1990-07-22'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'bob.wilson@example.com',
  'Bob',
  'Wilson',
  'patient',
  '+1-555-0125',
  '1975-11-08'
) ON CONFLICT (email) DO NOTHING;