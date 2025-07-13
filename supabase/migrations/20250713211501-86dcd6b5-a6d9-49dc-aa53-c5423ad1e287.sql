-- Add consultation_notes column to appointments table for dentist summaries
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS consultation_notes TEXT;

-- Create some sample appointments for testing
-- First, let's create a sample dentist profile and dentist record
INSERT INTO public.profiles (
  id,
  user_id,
  email,
  first_name,
  last_name,
  role
) VALUES (
  'sample-dentist-profile-id',
  'sample-user-id',
  'dentist@example.com',
  'Dr. Sarah',
  'Johnson',
  'dentist'
) ON CONFLICT (id) DO NOTHING;

-- Create dentist record
INSERT INTO public.dentists (
  id,
  profile_id,
  specialization,
  license_number,
  is_active
) VALUES (
  'sample-dentist-id',
  'sample-dentist-profile-id',
  'General Dentistry',
  'DDS-12345',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create sample patient profiles
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
  'patient-1-id',
  'patient-1-user-id',
  'john.doe@example.com',
  'John',
  'Doe',
  'patient',
  '+1-555-0123',
  '1985-03-15'
),
(
  'patient-2-id',
  'patient-2-user-id',
  'jane.smith@example.com',
  'Jane',
  'Smith',
  'patient',
  '+1-555-0124',
  '1990-07-22'
),
(
  'patient-3-id',
  'patient-3-user-id',
  'bob.wilson@example.com',
  'Bob',
  'Wilson',
  'patient',
  '+1-555-0125',
  '1975-11-08'
)
ON CONFLICT (id) DO NOTHING;

-- Create sample appointments
INSERT INTO public.appointments (
  id,
  patient_id,
  dentist_id,
  patient_name,
  patient_age,
  appointment_date,
  reason,
  notes,
  status,
  urgency,
  duration_minutes
) VALUES 
(
  'appointment-1',
  'patient-1-id',
  'sample-dentist-id',
  'John Doe',
  39,
  '2025-07-15 09:00:00+00',
  'Routine cleaning and checkup',
  'No known allergies. Regular patient.',
  'pending',
  'low',
  60
),
(
  'appointment-2',
  'patient-2-id',
  'sample-dentist-id',
  'Jane Smith',
  34,
  '2025-07-15 14:30:00+00',
  'Severe tooth pain in upper left molar',
  'Allergic to penicillin. Had wisdom teeth removed last year.',
  'pending',
  'high',
  45
),
(
  'appointment-3',
  'patient-3-id',
  'sample-dentist-id',
  'Bob Wilson',
  49,
  '2025-07-16 10:15:00+00',
  'Broken filling needs replacement',
  'Diabetic - taking metformin. Prefers afternoon appointments.',
  'pending',
  'medium',
  90
),
(
  'appointment-4',
  'patient-1-id',
  'sample-dentist-id',
  'John Doe',
  39,
  '2025-07-14 11:00:00+00',
  'Follow-up after root canal',
  'No known allergies. Root canal completed last week.',
  'confirmed',
  'medium',
  30
)
ON CONFLICT (id) DO NOTHING;