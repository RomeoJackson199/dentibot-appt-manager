-- Update the similar email to be a dentist and create dentist entry
UPDATE profiles 
SET role = 'dentist'
WHERE email = 'Romeojulianjackson@gmail.com';

-- Create dentist entry for this user
INSERT INTO dentists (profile_id, is_active)
SELECT id, true 
FROM profiles 
WHERE email = 'Romeojulianjackson@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM dentists WHERE profile_id = profiles.id
);

-- Also let's make sure the trigger creates dentist entries automatically for dentist role signups
-- First, let's check if there's an existing trigger and function