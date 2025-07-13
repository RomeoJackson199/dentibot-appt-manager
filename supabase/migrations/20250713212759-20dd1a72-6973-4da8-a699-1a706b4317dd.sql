-- Update the correct email to be a dentist
UPDATE profiles 
SET role = 'dentist'
WHERE email = 'Romeojackson199@gmail.com';

-- Create dentist entry for this specific user
INSERT INTO dentists (profile_id, is_active)
SELECT id, true 
FROM profiles 
WHERE email = 'Romeojackson199@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM dentists WHERE profile_id = profiles.id
);