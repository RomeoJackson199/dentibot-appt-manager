-- Let's create Romeo's profile and link him to Virginie's dentist practice
-- First create the profile
INSERT INTO profiles (
  user_id,
  email,
  first_name,
  last_name,
  role
) VALUES (
  gen_random_uuid(), -- Generate a UUID for user_id
  'romeojackson199@gmail.com',
  'Romeo',
  'Jackson',
  'dentist'
) ON CONFLICT (email) DO UPDATE SET
  role = 'dentist',
  first_name = 'Romeo',
  last_name = 'Jackson';

-- Now create a dentist entry that shares Virginie's dentist ID
-- Actually, let's create a separate dentist ID but give Romeo access to Virginie's appointments
INSERT INTO dentists (profile_id, specialization, license_number, is_active)
SELECT id, 'Pédodontiste', 'LIC-VP2024-SHARED', true
FROM profiles 
WHERE email = 'romeojackson199@gmail.com'
ON CONFLICT DO NOTHING;