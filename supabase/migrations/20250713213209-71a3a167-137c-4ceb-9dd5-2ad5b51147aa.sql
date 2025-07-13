-- Create Romeo's profile
INSERT INTO profiles (
  user_id,
  email,
  first_name,
  last_name,
  role
) VALUES (
  gen_random_uuid(),
  'romeojackson199@gmail.com',
  'Romeo',
  'Jackson',
  'dentist'
);

-- Create a dentist entry for Romeo
INSERT INTO dentists (profile_id, specialization, license_number, is_active)
SELECT id, 'Pédodontiste', 'LIC-VP2024-SHARED', true
FROM profiles 
WHERE email = 'romeojackson199@gmail.com';